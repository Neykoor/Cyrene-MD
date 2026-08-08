import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import InfinitySQLite from 'infinitysqlite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCHEMA_PATH = path.join(__dirname, 'schema.sql')


const TABLES = {
  users: {
    pk: 'jid',
    bool: ['muto', 'premium', 'registered', 'banned', 'useDocument'],
    columns: [
      'exp', 'joincount', 'diamond', 'coin', 'lastadventure', 'lastclaim', 'health',
      'crime', 'lastcofre', 'lastdiamantes', 'lastpago', 'lastcode', 'lastcodereg',
      'lastduel', 'lastmining', 'muto', 'premium', 'premiumTime', 'registered',
      'genre', 'birth', 'marry', 'description', 'packstickers', 'name', 'age',
      'regTime', 'afk', 'afkReason', 'role', 'banned', 'useDocument', 'bank',
      'warn', 'wins', 'losses', 'draws', 'spam',
    ],
  },
  chats: {
    pk: 'jid',
    bool: [
      'isBanned', 'welcome', 'autoresponder', 'delete', 'autoAceptar', 'autoRechazar',
      'detect', 'economy', 'gacha', 'antiBot', 'antiBot2', 'modoadmin', 'antiLink',
      'antifake', 'antiarabes', 'reaction', 'nsfw',
    ],
    columns: [
      'isBanned', 'sAutoresponder', 'welcome', 'autoresponder', 'delete', 'autoAceptar',
      'autoRechazar', 'detect', 'economy', 'gacha', 'antiBot', 'antiBot2', 'modoadmin',
      'antiLink', 'antifake', 'antiarabes', 'reaction', 'nsfw', 'expired',
    ],
  },
  settings: {
    pk: 'bot_jid',
    bool: ['self', 'restrict', 'jadibotmd', 'antiPrivate', 'autoread'],
    columns: ['self', 'restrict', 'jadibotmd', 'antiPrivate', 'autoread', 'status'],
  },
  stats: {
    pk: 'plugin_name',
    bool: [],
    columns: ['total', 'success'],
  },
}

function quoteCol(col) {
  
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col) ? `"${col}"` : col
}

export function initDatabase(filePath = './database.sqlite') {
  const db = new InfinitySQLite(filePath)
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('foreign_keys = ON')
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8')
  db.exec(schema)
  return db
}

function hydrateRow(def, row) {
  const { pk, bool, columns } = def
  const obj = {}
  for (const col of columns) {
    obj[col] = bool.includes(col) ? !!row[col] : row[col]
  }
  if (row.extra) {
    try {
      Object.assign(obj, JSON.parse(row.extra))
    } catch { /* extra corrupto, se ignora */ }
  }
  return obj
}

function loadTable(db, tableName) {
  const def = TABLES[tableName]
  const rows = db.prepare(`SELECT * FROM ${tableName}`).all()
  const out = {}
  for (const row of rows) {
    out[row[def.pk]] = hydrateRow(def, row)
  }
  return out
}

export function loadAllIntoMemory(db) {
  const data = {
    users: loadTable(db, 'users'),
    chats: loadTable(db, 'chats'),
    settings: loadTable(db, 'settings'),
    stats: loadTable(db, 'stats'),
    msgs: {},
    sticker: {},
  }
  for (const row of db.prepare('SELECT * FROM msgs').all()) {
    try { data.msgs[row.id] = JSON.parse(row.data) } catch { data.msgs[row.id] = {} }
  }
  for (const row of db.prepare('SELECT * FROM sticker').all()) {
    try { data.sticker[row.hash] = JSON.parse(row.data) } catch { data.sticker[row.hash] = {} }
  }
  return data
}

function upsertRow(db, tableName, key, obj) {
  const def = TABLES[tableName]
  const { pk, bool, columns } = def
  const extra = {}
  const values = { [pk]: key }

  for (const [field, value] of Object.entries(obj || {})) {
    if (columns.includes(field)) {
      values[field] = bool.includes(field) ? (value ? 1 : 0) : value
    } else {
      extra[field] = value
    }
  }
  for (const col of columns) {
    if (!(col in values)) values[col] = bool.includes(col) ? 0 : null
  }
  values.extra = JSON.stringify(extra)

  const cols = [pk, ...columns, 'extra']
  const placeholders = cols.map((c) => `@${c.replace(/[^a-zA-Z0-9_]/g, '')}`)
  const updateSet = columns
    .concat('extra')
    .map((c) => `${quoteCol(c)} = excluded.${quoteCol(c)}`)
    .join(', ')

  const params = {}
  for (const c of cols) params[c.replace(/[^a-zA-Z0-9_]/g, '')] = values[c]

  const sql = `
    INSERT INTO ${tableName} (${cols.map(quoteCol).join(', ')})
    VALUES (${placeholders.join(', ')})
    ON CONFLICT(${quoteCol(pk)}) DO UPDATE SET ${updateSet}
  `
  db.prepare(sql).run(params)
}

export function flushToDatabase(db, data) {
  const run = db.transaction((snapshot) => {
    for (const [tableName, bucket] of [
      ['users', snapshot.users],
      ['chats', snapshot.chats],
      ['settings', snapshot.settings],
      ['stats', snapshot.stats],
    ]) {
      for (const [key, obj] of Object.entries(bucket || {})) {
        upsertRow(db, tableName, key, obj)
      }
    }
    for (const [id, obj] of Object.entries(snapshot.msgs || {})) {
      db.prepare(
        'INSERT INTO msgs (id, data) VALUES (@id, @data) ON CONFLICT(id) DO UPDATE SET data = excluded.data'
      ).run({ id, data: JSON.stringify(obj) })
    }
    for (const [hash, obj] of Object.entries(snapshot.sticker || {})) {
      db.prepare(
        'INSERT INTO sticker (hash, data) VALUES (@hash, @data) ON CONFLICT(hash) DO UPDATE SET data = excluded.data'
      ).run({ hash, data: JSON.stringify(obj) })
    }
  })
  run(data)
}

export function closeDatabase(db) {
  try {
    db.checkpoint('TRUNCATE')
  } catch (e) {
    console.error('[db] fallo el checkpoint final:', e)
  }
  db.close()
}
