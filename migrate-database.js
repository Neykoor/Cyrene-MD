// Migración única: database.json (lowdb) -> database.sqlite (InfinitySQLite)
//
// Uso:
//   node migrate-database.js
//
// No borra ni toca database.json. Si ya existe database.sqlite, este script
// hace upsert (no duplica), así que es seguro correrlo más de una vez.

import fs from 'fs'
import { initDatabase, flushToDatabase, closeDatabase } from './lib/db.js'

const JSON_PATH = './database.json'
const SQLITE_PATH = './database.sqlite'

if (!fs.existsSync(JSON_PATH)) {
  console.error(`[migrate] no se encontró ${JSON_PATH}, nada que migrar.`)
  process.exit(1)
}

const raw = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'))

const data = {
  users: raw.users || {},
  chats: raw.chats || {},
  settings: raw.settings || {},
  stats: raw.stats || {},
  msgs: raw.msgs || {},
  sticker: raw.sticker || {},
}

console.log('[migrate] usuarios:', Object.keys(data.users).length)
console.log('[migrate] chats:', Object.keys(data.chats).length)
console.log('[migrate] settings (bots):', Object.keys(data.settings).length)
console.log('[migrate] stats (plugins):', Object.keys(data.stats).length)

const db = initDatabase(SQLITE_PATH)
flushToDatabase(db, data)
closeDatabase(db)

console.log(`[migrate] listo -> ${SQLITE_PATH}`)
