import fs from "fs";
import path from "path";
import yts from "yt-search";
import axios from "axios";
import sharp from "sharp";
import { fetchRandomPinterestImage } from "../../src/libs/scraper";

const API_KEY = "yosoyyo_sk_fsy4b2in";
const API_URL = "https://apiyosoyyo-ofc.onrender.com/api/youtube";

function resolveMediaPath(filename: string): string | undefined {
  const candidates = [
    path.join(__dirname, "..", "..", "src", "media", filename),
    path.join(__dirname, "..", "src", "media", filename),
    path.join(process.cwd(), "src", "media", filename),
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));

  if (!found) {
    console.error(
      `[play] no se encontró "${filename}". Rutas probadas:\n${candidates.join("\n")}`
    );
  }

  return found;
}

function loadMediaBuffer(filename: string): Buffer | undefined {
  const filePath = resolveMediaPath(filename);
  return filePath ? fs.readFileSync(filePath) : undefined;
}

let cachedFallbackThumbnail: Buffer | undefined;

async function getLocalFallbackThumbnail(): Promise<Buffer | undefined> {
  if (cachedFallbackThumbnail) return cachedFallbackThumbnail;

  const raw = loadMediaBuffer("business-thumb.jpg");
  if (!raw) return undefined;

  try {
    cachedFallbackThumbnail = await sharp(raw)
      .resize(120, 120, { fit: "cover" })
      .jpeg({
        quality: 60,
        progressive: false,
      })
      .toBuffer();
  } catch {
    cachedFallbackThumbnail = raw;
  }

  return cachedFallbackThumbnail;
}

async function getOrderThumbnail(): Promise<Buffer | undefined> {
  try {
    const raw = await fetchRandomPinterestImage();

    return await sharp(raw)
      .resize(120, 120, { fit: "cover" })
      .jpeg({
        quality: 60,
        progressive: false,
      })
      .toBuffer();
  } catch (err) {
    console.error(
      "[play] no se pudo traer imagen de Pinterest, uso el fallback local:",
      err
    );

    return getLocalFallbackThumbnail();
  }
}

async function buildFakeOrderQuote(): Promise<any> {
  const thumbnail = await getOrderThumbnail();
  const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  return {
    key: {
      fromMe: false,
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      id: `FAKE-ORDER-${uniqueSuffix}`,
    },

    message: {
      orderMessage: {
        orderTitle: "Pedido de Cyrene-DM ✓",
        itemCount: 12,
        thumbnail,
        surface: 1,
        status: 2,
        sellerJid: "0@s.whatsapp.net",
        token: `FAKE-TOKEN-${uniqueSuffix}`,
      },
    },
  };
}

function cleanName(name: string): string {
  return String(name).replace(/[^\w\s._-]/gi, "").substring(0, 50);
}

function formatViews(views: number | string): string {
  const n = Number(views);
  if (!n || Number.isNaN(n)) return "No disponible";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
}

function isYouTubeUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url);
}

function extractVideoId(url: string): string | null {
  const match =
    url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:[?&/]|\b)/) ||
    url.match(/youtu\.be\/([0-9A-Za-z_-]{11})/);
  return match?.[1] || null;
}

async function downloadMedia(
  sock: any,
  chatId: string,
  queryOrUrl: string,
  quotedMsg: any,
  format: "mp3" | "mp4" = "mp3"
): Promise<void> {
  try {
    const isVideo = format === "mp4";
    const sent = await sock.sendMessage(
      chatId,
      { text: isVideo ? "❀ Descargando video..." : "❀ Descargando audio..." },
      { quoted: quotedMsg }
    );

    const apiUrl = `${API_URL}?q=${encodeURIComponent(queryOrUrl)}&apiKey=${encodeURIComponent(API_KEY)}`;
    const r = await axios.get(apiUrl, { timeout: 90000 });

    if (r.status !== 200 || !r.data) {
      await sock.sendMessage(
        chatId,
        { text: `✦ Error HTTP ${r.status} al procesar el ${format}.` },
        { quoted: quotedMsg }
      );
      return;
    }

    const data: any = r.data;
    const firstItem = data?.result?.[0];
    const fileUrl = isVideo
      ? firstItem?.download?.mp4 ||
        firstItem?.downloads?.mp4?.url ||
        firstItem?.downloads?.mixed?.mp4 ||
        firstItem?.dl?.mp4?.url
      : firstItem?.download?.mp3 ||
        firstItem?.downloads?.mp3?.url ||
        firstItem?.downloads?.mixed?.mp3 ||
        firstItem?.dl?.mp3?.url ||
        firstItem?.download?.url;

    if (!data?.status || !firstItem || !fileUrl) {
      await sock.sendMessage(
        chatId,
        { text: `✦ No se pudo obtener el archivo de ${format}.` },
        { quoted: quotedMsg }
      );
      return;
    }

    const fileTitle = cleanName(firstItem.title || format);

    await sock.sendMessage(
      chatId,
      isVideo
        ? {
            video: { url: fileUrl },
            mimetype: "video/mp4",
            caption: `❀ Video descargado ✓\n\n✦ Título › _${fileTitle}_`,
          }
        : {
            audio: { url: fileUrl },
            mimetype: "audio/mpeg",
            fileName: `${fileTitle}.mp3`,
            ptt: false,
          },
      { quoted: await buildFakeOrderQuote() }
    );

    try {
      await sock.sendMessage(chatId, {
        text: `❀ Descarga completada ✓\n\n✦ Título › _${fileTitle}_`,
        edit: sent.key,
      });
    } catch {
      await sock.sendMessage(chatId, {
        text: `❀ Descarga completada ✓\n\n✦ Título › _${fileTitle}_`,
      });
    }
  } catch (err: any) {
    console.error("[play] error en downloadMedia:", err);
    await sock.sendMessage(chatId, {
      text: `✦ Error durante la descarga › ${err.message}`,
    });
  }
}

export async function downloadAndSend(
  sock: any,
  msg: any,
  url: string,
  format: "mp3" | "mp4"
): Promise<void> {
  const chatId: string = msg.key.remoteJid;
  await downloadMedia(sock, chatId, url, msg, format);
}

export async function sendPlay(
  sock: any,
  msg: any,
  text: string
): Promise<void> {
  const chatId: string = msg.key.remoteJid;
  const isGroup = chatId.endsWith("@g.us");
  const senderJid: string = isGroup
    ? msg.key.participant || msg.key.remoteJid
    : msg.key.remoteJid;

  if (!text) {
    await sock.sendMessage(chatId, {
      text: "❀ Por favor ingresa el nombre o enlace de un video.",
    });
    return;
  }

  try {
    let url = text.trim();
    let title = "Desconocido";
    let authorName = "Desconocido";
    let durationTimestamp = "Desconocida";
    let views: number | string = 0;
    let thumbnail = "";

    const isUrl = /^https?:\/\/\S+/i.test(url);

    if (isUrl) {
      if (!isYouTubeUrl(url)) {
        await sock.sendMessage(chatId, {
          text: "✦ El enlace proporcionado no es válido para YouTube.",
        });
        return;
      }

      const videoId = extractVideoId(url);
      if (!videoId) {
        await sock.sendMessage(chatId, {
          text: "✦ No se pudo extraer el ID del video.",
        });
        return;
      }

      const res: any = await yts({ videoId });

      if (res) {
        title = res.title || title;
        authorName = res.author?.name || authorName;
        durationTimestamp = res.timestamp || durationTimestamp;
        views = res.views || views;
        thumbnail = res.thumbnail || thumbnail;
        url = res.url || url;
      }
    } else {
      const res: any = await yts(url);

      if (!res?.videos?.length) {
        await sock.sendMessage(chatId, {
          text: "✦ No se encontraron resultados.",
        });
        return;
      }

      const video = res.videos[0];
      title = video.title || title;
      authorName = video.author?.name || authorName;
      durationTimestamp = video.timestamp || durationTimestamp;
      views = video.views || views;
      url = video.url || url;
      thumbnail = video.thumbnail || thumbnail;
    }

    const caption =
      `❀ Hola @${senderJid.split("@")[0]}, soy Cyrene\n` +
      "⌁ Tu asistente virtual\n\n" +
      `♧ Título › ${title}\n` +
      `✦ Canal › ${authorName}\n` +
      `◈ Vistas › ${formatViews(views)}\n` +
      `⌂ Duración › ${durationTimestamp}\n` +
      `◇ Enlace › ${url}\n\n` +
      "❖ Elige el formato de descarga:";

    const content: any = {
      caption,
      subtitle: "𖤐 Asistente Virtual",
      mentions: [senderJid],
      contextInfo: {
        mentionedJid: [senderJid],
      },
      interactiveButtons: [
        {
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: "🎵 MP3",
            id: `play_mp3_${encodeURIComponent(url)}`,
          }),
        },
        {
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: "🎬 MP4",
            id: `play_mp4_${encodeURIComponent(url)}`,
          }),
        },
      ],
    };

    if (thumbnail) {
      try {
        const res = await axios.get(thumbnail, { responseType: "arraybuffer", timeout: 15000 });
        content.image = Buffer.from(res.data);
      } catch {
        const fallback = loadMediaBuffer("menu-cover.jpg");
        if (fallback) content.image = fallback;
      }
    }

    const quotedOrder = await buildFakeOrderQuote();

    await sock.sendMessage(chatId, content, { quoted: quotedOrder });
  } catch (err: any) {
    console.error("[play] error principal:", err);
    await sock.sendMessage(chatId, {
      text: `✦ Ocurrió un error al procesar la solicitud › ${err.message}`,
    });
  }
}

export const commands = ["play", "yt", "yta"];

export async function run(sock: any, msg: any, args: string[]): Promise<void> {
  await sendPlay(sock, msg, args.join(" ").trim());
}
