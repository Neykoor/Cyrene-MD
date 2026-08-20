import axios from "axios";
import { isOwner } from "../../config";
import { isSenderGroupAdmin } from "../../src/libs/group";
import {
  addCharacter,
  characterExists,
  getGroupRating,
  setGroupRating,
  GachaRating,
} from "../../src/libs/gacha";

const randomValue = (): number => Math.floor(Math.random() * (8000 - 3000 + 1) + 3000);
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const EXCLUDED_TAGS = new Set(["loli", "lolicon", "shota", "shotacon", "toddlercon", "child"]);

interface YanderePost {
  tags?: string;
  rating?: string;
  sample_url?: string;
  jpeg_url?: string;
  file_url?: string;
  score?: number;
}

interface PendingRequest {
  mode: "single" | "random";
  seriesTag?: string;
  extraTags?: string[];
}

interface GenerationResult {
  seriesName: string;
  agregados: string[];
  saltados: string[];
  duplicados: string[];
  totalPosts: number;
}

const pendingRequests = new Map<string, PendingRequest>();

function parseYandereUrl(input: string): { seriesTag: string; extraTags: string[] } | null {
  try {
    const url = new URL(input);
    if (!url.hostname.includes("yande.re")) return null;
    const rawTags = url.searchParams.get("tags");
    if (!rawTags) return null;
    const tags = rawTags.trim().split(/\s+/).filter(Boolean);
    return { seriesTag: tags[0], extraTags: tags.slice(1) };
  } catch {
    return null;
  }
}

function tagToSeriesName(tag: string): string {
  return tag.replace(/[_:]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

function tagToName(tag: string): string {
  const baseName = tag.replace(/_\(.*?\)$/, "");
  return baseName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

function hasExcludedTag(tagString: string): boolean {
  const tags = (tagString || "").toLowerCase().split(/\s+/);
  return tags.some((t) => EXCLUDED_TAGS.has(t));
}

async function fetchPostsBatch(
  seriesTag: string,
  extraTags: string[],
  rating: GachaRating,
  page: number
): Promise<YanderePost[]> {
  const baseTags = [seriesTag, ...extraTags, `rating:${rating}`].join(" ");
  const url = `https://yande.re/post.json?tags=${encodeURIComponent(baseTags)}&limit=100&page=${page}`;

  try {
    const res = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 15000 });
    const posts = res.data;
    if (!Array.isArray(posts)) return [];

    return posts.filter((post: YanderePost) => {
      const tagStr = (post.tags || "").toLowerCase();
      if (hasExcludedTag(tagStr)) return false;
      if (tagStr.split(/\s+/).includes("crossover")) return false;
      return true;
    });
  } catch {
    return [];
  }
}

function collectTagFrequencies(posts: YanderePost[], seriesTag: string): Record<string, number> {
  const SKIP = new Set([
    "highres",
    "absurdres",
    "1girl",
    "solo",
    "breasts",
    "nipples",
    "cum",
    "crossover",
    ...EXCLUDED_TAGS,
  ]);

  const freq: Record<string, number> = {};
  for (const post of posts) {
    const tagStr = post.tags || "";
    for (const t of tagStr.split(/\s+/).filter(Boolean)) {
      if (SKIP.has(t) || t === seriesTag) continue;
      freq[t] = (freq[t] || 0) + 1;
    }
  }
  return freq;
}

async function filterCharacterTags(tagNames: string[]): Promise<string[]> {
  const characters: string[] = [];

  for (let i = 0; i < tagNames.length; i += 2) {
    const batch = tagNames.slice(i, i + 2);

    await Promise.all(
      batch.map(async (tag) => {
        if (EXCLUDED_TAGS.has(tag)) return;
        try {
          const res = await axios.get(`https://yande.re/tag.json?name=${encodeURIComponent(tag)}`, {
            timeout: 15000,
          });
          const data = res.data;
          if (Array.isArray(data) && data.find((t: any) => t.name === tag && t.type === 4)) {
            characters.push(tag);
          }
        } catch {
        }
      })
    );

    await delay(1200);
  }

  return characters;
}

function pickCharacterImage(charTag: string, posts: YanderePost[]): string | null {
  const matches = posts.filter((p) => (p.tags || "").split(/\s+/).includes(charTag));
  if (matches.length === 0) return null;

  matches.sort((a, b) => (b.score || 0) - (a.score || 0));
  const best = matches[0];
  return best.sample_url || best.jpeg_url || best.file_url || null;
}

function getGenderFromPosts(charTag: string, posts: YanderePost[]): string {
  let male = 0;
  let female = 0;

  for (const post of posts) {
    const tagStr = post.tags || "";
    if (!tagStr.includes(charTag)) continue;
    const tags = tagStr.split(/\s+/);
    if (tags.some((t) => ["male", "1boy", "boy"].includes(t))) male++;
    if (tags.some((t) => ["female", "1girl", "girl"].includes(t))) female++;
  }

  return male > female ? "Masculino" : "Femenino";
}

async function runGeneration(
  sock: any,
  chatId: string,
  seriesTag: string,
  extraTags: string[],
  rating: GachaRating,
  pages: number
): Promise<GenerationResult> {
  const seriesName = tagToSeriesName(seriesTag);
  const posts: YanderePost[] = [];

  for (let page = 1; page <= pages; page++) {
    await sock.sendMessage(chatId, {
      text: `📦 Tanda ${page}/${pages} › descargando posts de *${seriesName}*...`,
    });

    const batch = await fetchPostsBatch(seriesTag, extraTags, rating, page);
    if (batch.length === 0) break;

    posts.push(...batch);
    if (batch.length < 100) break;
    await delay(1000);
  }

  if (posts.length === 0) {
    return { seriesName, agregados: [], saltados: [], duplicados: [], totalPosts: 0 };
  }

  const tagFreq = collectTagFrequencies(posts, seriesTag);
  const candidateTags = Object.keys(tagFreq).filter((name) => tagFreq[name] >= 2);
  const charTagNames = await filterCharacterTags(candidateTags);

  const agregados: string[] = [];
  const saltados: string[] = [];
  const duplicados: string[] = [];

  for (const charTag of charTagNames) {
    const dbName = tagToName(charTag);

    if (characterExists(charTag)) {
      duplicados.push(dbName);
      continue;
    }

    const imageUrl = pickCharacterImage(charTag, posts);
    if (!imageUrl) {
      saltados.push(`${dbName} (Sin imagen)`);
      continue;
    }

    try {
      const check = await axios.head(imageUrl, { timeout: 4000 });
      const contentType = check.headers["content-type"];
      if (!contentType || !String(contentType).startsWith("image/")) {
        saltados.push(`${dbName} (Link caído/No es imagen)`);
        continue;
      }
    } catch {
      saltados.push(`${dbName} (Timeout del link)`);
      continue;
    }

    addCharacter({
      name: dbName,
      series: seriesName,
      gender: getGenderFromPosts(charTag, posts),
      booru_tag: charTag,
      image_url: imageUrl,
      value: randomValue(),
    });

    agregados.push(dbName);
    await delay(500);
  }

  return { seriesName, agregados, saltados, duplicados, totalPosts: posts.length };
}

async function fetchRandomSeriesTags(cantidad: number): Promise<string[]> {
  try {
    const pool = new Set<string>();
    const res = await axios.get("https://yande.re/tag.json?type=3&order=count&limit=100&page=1", {
      timeout: 15000,
    });
    const tags = res.data;
    if (!Array.isArray(tags)) return [];

    tags.forEach((t: any) => {
      if (t.count >= 30) pool.add(t.name);
    });

    return [...pool].sort(() => Math.random() - 0.5).slice(0, cantidad);
  } catch {
    return [];
  }
}

function ratingLabel(rating: GachaRating): string {
  return rating === "safe" ? "🟢 Safe" : "🟡 Questionable";
}

function extractSender(msg: any): string {
  return msg.key.participant
    ? msg.key.participant.replace(/[^0-9]/g, "")
    : msg.key.remoteJid.replace(/[^0-9]/g, "");
}

function getInvokedCommand(msg: any): string {
  const messageText: string = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
  if (!messageText.startsWith(global.prefix)) return "";
  return messageText.slice(global.prefix.length).trim().split(" ")[0].toLowerCase();
}

async function sendRatingPrompt(sock: any, msg: any, chatId: string): Promise<void> {
  await sock.sendMessage(
    chatId,
    {
      text:
        "⚙️ *Configuración del gacha requerida*\n\n" +
        "Antes de generar personajes, un administrador del grupo debe elegir el nivel de contenido que usará *genchar* aquí:",
      footer: "Cyrene · Gacha",
      interactiveButtons: [
        {
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({ display_text: "🟢 Safe", id: "genchar_rating_safe" }),
        },
        {
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({ display_text: "🟡 Questionable", id: "genchar_rating_questionable" }),
        },
      ],
    },
    { quoted: msg }
  );
}

async function requireAdmin(sock: any, msg: any, chatId: string, sender: string): Promise<boolean> {
  if (isOwner(sender)) return true;

  const admin = await isSenderGroupAdmin(sock, chatId, sender);
  if (!admin) {
    await sock.sendMessage(
      chatId,
      { text: "❌ Solo un administrador del grupo puede usar este comando." },
      { quoted: msg }
    );
  }
  return admin;
}

async function reportResult(sock: any, chatId: string, res: GenerationResult): Promise<void> {
  const lines = [
    `✅ *${res.seriesName}* completado`,
    `⌁ Posts analizados: ${res.totalPosts}`,
    `⌁ Personajes agregados: ${res.agregados.length}`,
  ];
  if (res.duplicados.length) lines.push(`⌁ Ya existían: ${res.duplicados.length}`);
  if (res.saltados.length) lines.push(`⌁ Omitidos: ${res.saltados.length}`);

  await sock.sendMessage(chatId, { text: lines.join("\n") });
}

async function runSingleFlow(
  sock: any,
  msg: any,
  chatId: string,
  rating: GachaRating,
  seriesTag: string,
  extraTags: string[]
): Promise<void> {
  await sock.sendMessage(chatId, { text: "⏳ Extrayendo personajes..." });
  const res = await runGeneration(sock, chatId, seriesTag, extraTags, rating, 5);
  await reportResult(sock, chatId, res);
}

async function runRandomFlow(sock: any, msg: any, chatId: string, rating: GachaRating): Promise<void> {
  const tags = await fetchRandomSeriesTags(5);

  if (tags.length === 0) {
    await sock.sendMessage(
      chatId,
      { text: "❌ Yande.re rechazó la conexión. Espera unos minutos." },
      { quoted: msg }
    );
    return;
  }

  for (let i = 0; i < tags.length; i++) {
    await sock.sendMessage(chatId, { text: `⏳ Serie ${i + 1}/${tags.length} › *${tagToSeriesName(tags[i])}*` });
    const res = await runGeneration(sock, chatId, tags[i], [], rating, 5);
    await reportResult(sock, chatId, res);
  }

  await sock.sendMessage(chatId, { text: "✅ Proceso *genrandom* completado." }, { quoted: msg });
}

async function executeFlow(sock: any, msg: any, chatId: string, rating: GachaRating, req: PendingRequest): Promise<void> {
  try {
    if (req.mode === "random") {
      await runRandomFlow(sock, msg, chatId, rating);
    } else if (req.seriesTag) {
      await runSingleFlow(sock, msg, chatId, rating, req.seriesTag, req.extraTags || []);
    }
  } catch (e: any) {
    await sock.sendMessage(
      chatId,
      { text: `❌ Hubo un error inesperado al generar: ${e.message}` },
      { quoted: msg }
    );
  }
}

export async function handleGenCharCommand(
  sock: any,
  msg: any,
  args: string[],
  sender: string,
  command: string
): Promise<void> {
  const chatId: string = msg.key.remoteJid;

  if (!chatId.endsWith("@g.us")) {
    await sock.sendMessage(chatId, { text: "❌ Este comando solo funciona dentro de un grupo." }, { quoted: msg });
    return;
  }

  const allowed = await requireAdmin(sock, msg, chatId, sender);
  if (!allowed) return;

  let req: PendingRequest;

  if (command === "genrandom") {
    req = { mode: "random" };
  } else {
    const parsed = parseYandereUrl(args.join(" "));
    if (!parsed) {
      await sock.sendMessage(chatId, { text: "❌ URL inválida. Usa un link de Yande.re." }, { quoted: msg });
      return;
    }
    req = { mode: "single", seriesTag: parsed.seriesTag, extraTags: parsed.extraTags };
  }

  const rating = getGroupRating(chatId);

  if (!rating) {
    pendingRequests.set(chatId, req);
    await sendRatingPrompt(sock, msg, chatId);
    return;
  }

  await executeFlow(sock, msg, chatId, rating, req);
}

export async function handleGenCharButton(sock: any, msg: any, buttonId: string): Promise<void> {
  const chatId: string = msg.key.remoteJid;

  const rating: GachaRating | null =
    buttonId === "genchar_rating_safe" ? "safe" : buttonId === "genchar_rating_questionable" ? "questionable" : null;
  if (!rating) return;

  const sender = extractSender(msg);
  const allowed = isOwner(sender) || (await isSenderGroupAdmin(sock, chatId, sender));

  if (!allowed) {
    await sock.sendMessage(
      chatId,
      { text: "❌ Solo un administrador del grupo puede configurar esto." },
      { quoted: msg }
    );
    return;
  }

  setGroupRating(chatId, rating, sender);
  await sock.sendMessage(chatId, { text: `✅ Nivel de contenido configurado en ${ratingLabel(rating)} para este grupo.` });

  const pending = pendingRequests.get(chatId);
  if (!pending) return;

  pendingRequests.delete(chatId);
  await executeFlow(sock, msg, chatId, rating, pending);
}

export const commands = ["genchar", "genrandom", "gacharating"];

export async function run(sock: any, msg: any, args: string[], sender: string): Promise<void> {
  const chatId: string = msg.key.remoteJid;
  const command = getInvokedCommand(msg);

  if (command === "gacharating") {
    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(chatId, { text: "❌ Este comando solo funciona dentro de un grupo." }, { quoted: msg });
      return;
    }

    const allowed = await requireAdmin(sock, msg, chatId, sender);
    if (!allowed) return;

    pendingRequests.delete(chatId);
    await sendRatingPrompt(sock, msg, chatId);
    return;
  }

  await handleGenCharCommand(sock, msg, args, sender, command);
}
