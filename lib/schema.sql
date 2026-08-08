CREATE TABLE IF NOT EXISTS users (
  jid            TEXT PRIMARY KEY,
  exp            INTEGER NOT NULL DEFAULT 0,
  joincount      INTEGER NOT NULL DEFAULT 1,
  diamond        INTEGER NOT NULL DEFAULT 3,
  coin           INTEGER NOT NULL DEFAULT 0,
  lastadventure  INTEGER NOT NULL DEFAULT 0,
  lastclaim      INTEGER NOT NULL DEFAULT 0,
  health         INTEGER NOT NULL DEFAULT 100,
  crime          INTEGER NOT NULL DEFAULT 0,
  lastcofre      INTEGER NOT NULL DEFAULT 0,
  lastdiamantes  INTEGER NOT NULL DEFAULT 0,
  lastpago       INTEGER NOT NULL DEFAULT 0,
  lastcode       INTEGER NOT NULL DEFAULT 0,
  lastcodereg    INTEGER NOT NULL DEFAULT 0,
  lastduel       INTEGER NOT NULL DEFAULT 0,
  lastmining     INTEGER NOT NULL DEFAULT 0,
  muto           INTEGER NOT NULL DEFAULT 0,
  premium        INTEGER NOT NULL DEFAULT 0,
  premiumTime    INTEGER NOT NULL DEFAULT 0,
  registered     INTEGER NOT NULL DEFAULT 0,
  genre          TEXT    NOT NULL DEFAULT '',
  birth          TEXT    NOT NULL DEFAULT '',
  marry          TEXT    NOT NULL DEFAULT '',
  description    TEXT    NOT NULL DEFAULT '',
  packstickers   TEXT,
  name           TEXT    NOT NULL DEFAULT '',
  age            INTEGER NOT NULL DEFAULT -1,
  regTime        INTEGER NOT NULL DEFAULT -1,
  afk            INTEGER NOT NULL DEFAULT -1,
  afkReason      TEXT    NOT NULL DEFAULT '',
  role           TEXT    NOT NULL DEFAULT 'Nuv',
  banned         INTEGER NOT NULL DEFAULT 0,
  useDocument    INTEGER NOT NULL DEFAULT 0,
  bank           INTEGER NOT NULL DEFAULT 0,
  warn           INTEGER NOT NULL DEFAULT 0,
  wins           INTEGER NOT NULL DEFAULT 0,
  losses         INTEGER NOT NULL DEFAULT 0,
  draws          INTEGER NOT NULL DEFAULT 0,
  spam           INTEGER NOT NULL DEFAULT 0,
  extra          TEXT    NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS chats (
  jid            TEXT PRIMARY KEY,
  isBanned       INTEGER NOT NULL DEFAULT 0,
  sAutoresponder TEXT    NOT NULL DEFAULT '',
  welcome        INTEGER NOT NULL DEFAULT 0,
  autoresponder  INTEGER NOT NULL DEFAULT 0,
  "delete"       INTEGER NOT NULL DEFAULT 0,
  autoAceptar    INTEGER NOT NULL DEFAULT 0,
  autoRechazar   INTEGER NOT NULL DEFAULT 0,
  detect         INTEGER NOT NULL DEFAULT 1,
  economy        INTEGER NOT NULL DEFAULT 1,
  gacha          INTEGER NOT NULL DEFAULT 1,
  antiBot        INTEGER NOT NULL DEFAULT 0,
  antiBot2       INTEGER NOT NULL DEFAULT 0,
  modoadmin      INTEGER NOT NULL DEFAULT 0,
  antiLink       INTEGER NOT NULL DEFAULT 1,
  antifake       INTEGER NOT NULL DEFAULT 0,
  antiarabes     INTEGER NOT NULL DEFAULT 0,
  reaction       INTEGER NOT NULL DEFAULT 0,
  nsfw           INTEGER NOT NULL DEFAULT 0,
  expired        INTEGER NOT NULL DEFAULT 0,
  extra          TEXT    NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS settings (
  bot_jid        TEXT PRIMARY KEY,
  self           INTEGER NOT NULL DEFAULT 0,
  restrict       INTEGER NOT NULL DEFAULT 1,
  jadibotmd      INTEGER NOT NULL DEFAULT 1,
  antiPrivate    INTEGER NOT NULL DEFAULT 0,
  autoread       INTEGER NOT NULL DEFAULT 0,
  status         INTEGER NOT NULL DEFAULT 0,
  extra          TEXT    NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS stats (
  plugin_name    TEXT PRIMARY KEY,
  total          INTEGER NOT NULL DEFAULT 0,
  success        INTEGER NOT NULL DEFAULT 0,
  extra          TEXT    NOT NULL DEFAULT '{}'
);


CREATE TABLE IF NOT EXISTS msgs (
  id             TEXT PRIMARY KEY,
  data           TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS sticker (
  hash           TEXT PRIMARY KEY,
  data           TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_users_banned  ON users(banned);
CREATE INDEX IF NOT EXISTS idx_chats_banned  ON chats(isBanned);
