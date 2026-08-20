import fs from "fs";
import path from "path";
import chalk from "chalk";
import Database from "infinitysqlite";

interface ConfigMedia {
  menuCover: string;
  businessThumb: string;
}

interface ConfigFile {
  prefix: string;
  pinterestQueries: string[];
  media: ConfigMedia;
}

interface ConfigRow {
  value: string;
}

interface QueryRow {
  query: string;
}

const dbDir = path.join(process.cwd(), "database");
const dbPath = path.join(dbDir, "cyrene.db");
const legacyConfigPath = path.join(process.cwd(), "config.json");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
db.exec("CREATE TABLE IF NOT EXISTS pinterest_queries (query TEXT PRIMARY KEY)");

const defaultConfig: ConfigFile = {
  prefix: ".",
  pinterestQueries: ["cyrene honkai star rail icon", "Japonesas icon"],
  media: {
    menuCover: "src/media/menu-cover.jpg",
    businessThumb: "src/media/business-thumb.jpg",
  },
};

const getConfigValue = db.prepare<ConfigRow, [string]>("SELECT value FROM config WHERE key = ?");
const setConfigValue = db.prepare<unknown, [string, string]>(
  "INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
);
const listQueries = db.prepare<QueryRow, []>("SELECT query FROM pinterest_queries ORDER BY rowid ASC");
const insertQuery = db.prepare<unknown, [string]>("INSERT OR IGNORE INTO pinterest_queries (query) VALUES (?)");

const insertQueries = db.transaction((queries: string[]) => {
  for (const query of queries) insertQuery.run(query);
});

function seedDefaults(): void {
  setConfigValue.run("prefix", defaultConfig.prefix);
  setConfigValue.run("media.menuCover", defaultConfig.media.menuCover);
  setConfigValue.run("media.businessThumb", defaultConfig.media.businessThumb);
  insertQueries(defaultConfig.pinterestQueries);
}

function migrateFromLegacyJson(): void {
  const raw = fs.readFileSync(legacyConfigPath, "utf-8");
  const parsed: Partial<ConfigFile> = JSON.parse(raw);

  setConfigValue.run("prefix", parsed.prefix || defaultConfig.prefix);
  setConfigValue.run("media.menuCover", parsed.media?.menuCover || defaultConfig.media.menuCover);
  setConfigValue.run("media.businessThumb", parsed.media?.businessThumb || defaultConfig.media.businessThumb);

  const queries = parsed.pinterestQueries?.length ? parsed.pinterestQueries : defaultConfig.pinterestQueries;
  insertQueries(queries);

  fs.renameSync(legacyConfigPath, `${legacyConfigPath}.migrated`);
  console.log(chalk.green(`✅ config.json migrado a ${chalk.yellow.bold("database/cyrene.db")} (InfinitySQLite)`));
}

const alreadyInitialized = getConfigValue.get("prefix") !== undefined;

if (!alreadyInitialized) {
  if (fs.existsSync(legacyConfigPath)) {
    migrateFromLegacyJson();
  } else {
    seedDefaults();
  }
} else {
  insertQueries(defaultConfig.pinterestQueries);
}

function readConfig(): ConfigFile {
  const prefixRow = getConfigValue.get("prefix");
  const menuCoverRow = getConfigValue.get("media.menuCover");
  const businessThumbRow = getConfigValue.get("media.businessThumb");
  const queryRows = listQueries.all();

  return {
    prefix: prefixRow?.value || defaultConfig.prefix,
    pinterestQueries: queryRows.length ? queryRows.map((row) => row.query) : defaultConfig.pinterestQueries,
    media: {
      menuCover: menuCoverRow?.value || defaultConfig.media.menuCover,
      businessThumb: businessThumbRow?.value || defaultConfig.media.businessThumb,
    },
  };
}

const config: ConfigFile = readConfig();

global.prefix = config.prefix;
global.pinterestQueries = config.pinterestQueries;
global.media = config.media;

global.owner = [
  ["526631079388", "Owner", true],
  ["34610990280", "Colaborador"],
  ["584242773183", "Colaborador"],
];

global.allowedPrefixes = [
  ".", "!", "#", "?", "-", "+", "*", "~", "$", "&", "%", "=", "🔥", "💀", "✅", "🥰",
  "💎", "🐱", "🐶", "🌟", "🎃", "🌸", "🪼", "🍑", "🛠️", "📌", "⚡", "🚀", "👀", "💡", "💣", "💯", "😎", "☠️", "👾",
];

global.isOwner = (user: string): boolean => {
  const cleaned = user.replace(/[^0-9]/g, "");
  return global.owner.some((entry) => entry[0] === cleaned);
};

global.setPrefix = (newPrefix: string): void => {
  if (global.allowedPrefixes.includes(newPrefix)) {
    global.prefix = newPrefix;
    setConfigValue.run("prefix", newPrefix);
    console.log(chalk.green(`✅ Prefijo cambiado a: ${chalk.yellow.bold(newPrefix)}`));
  } else {
    console.log(chalk.red(`❌ Prefijo no permitido. Usa uno de estos: ${chalk.blue.bold(global.allowedPrefixes.join(" "))}`));
  }
};

export const isOwner = global.isOwner;
export const setPrefix = global.setPrefix;
export const allowedPrefixes = global.allowedPrefixes;
export const pinterestQueries = global.pinterestQueries;
export const media = global.media;
