import fs from "fs";
import path from "path";
import Database from "infinitysqlite";

export type GachaRating = "safe" | "questionable";

interface CharacterRow {
  id: number;
  name: string;
  series: string;
  gender: string;
  booru_tag: string;
  image_url: string;
  value: number;
  created_at: number;
}

interface RatingRow {
  rating: string;
}

const dbDir = path.join(process.cwd(), "database");
const dbPath = path.join(dbDir, "cyrene.db");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.exec("PRAGMA journal_mode = WAL;");

db.exec(
  "CREATE TABLE IF NOT EXISTS gacha_characters (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, series TEXT NOT NULL, gender TEXT NOT NULL, booru_tag TEXT NOT NULL UNIQUE, image_url TEXT NOT NULL, value INTEGER NOT NULL, created_at INTEGER NOT NULL)"
);

db.exec(
  "CREATE TABLE IF NOT EXISTS gacha_group_config (chat_id TEXT PRIMARY KEY, rating TEXT NOT NULL, configured_by TEXT NOT NULL, updated_at INTEGER NOT NULL)"
);

const insertCharacterStmt = db.prepare<unknown, [string, string, string, string, string, number, number]>(
  "INSERT OR IGNORE INTO gacha_characters (name, series, gender, booru_tag, image_url, value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
);

const findByTagStmt = db.prepare<CharacterRow, [string]>(
  "SELECT * FROM gacha_characters WHERE booru_tag = ?"
);

const getRatingStmt = db.prepare<RatingRow, [string]>(
  "SELECT rating FROM gacha_group_config WHERE chat_id = ?"
);

const setRatingStmt = db.prepare<unknown, [string, string, string, number]>(
  "INSERT INTO gacha_group_config (chat_id, rating, configured_by, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(chat_id) DO UPDATE SET rating = excluded.rating, configured_by = excluded.configured_by, updated_at = excluded.updated_at"
);

export function characterExists(booruTag: string): boolean {
  return !!findByTagStmt.get(booruTag);
}

export function addCharacter(character: {
  name: string;
  series: string;
  gender: string;
  booru_tag: string;
  image_url: string;
  value: number;
}): boolean {
  const result: any = insertCharacterStmt.run(
    character.name,
    character.series,
    character.gender,
    character.booru_tag,
    character.image_url,
    character.value,
    Date.now()
  );
  return (result?.changes || 0) > 0;
}

export function getGroupRating(chatId: string): GachaRating | null {
  const row = getRatingStmt.get(chatId);
  return row?.rating === "safe" || row?.rating === "questionable" ? row.rating : null;
}

export function setGroupRating(chatId: string, rating: GachaRating, configuredBy: string): void {
  setRatingStmt.run(chatId, rating, configuredBy, Date.now());
}
