import axios from "axios";
import { TikTokClient } from "../../src/libs/tiktok-api";
import type {
  TiktokVideo,
  TiktokVideoFormat,
} from "../../src/libs/tiktok-api";

const tiktokClient = new TikTokClient({ region: "US" });

const TIKTOK_URL_REGEX =
  /https?:\/\/(?:www\.|vm\.|vt\.|m\.)?tiktok\.com\/\S+/i;

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
  Referer: "https://www.tiktok.com/",
};

function extractTiktokUrl(text: string): string | null {
  const match = text.match(TIKTOK_URL_REGEX);
  return match ? match[0] : null;
}

function formatCount(value: number | undefined): string {
  const n = Number(value || 0);
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
}

function pickBestFormat(
  video: TiktokVideo
): { url: string; hasWatermark: boolean } | null {
  const formats: TiktokVideoFormat[] = video.formats || [];

  if (formats.length > 0) {
    const withoutWatermark = formats.filter(
      (f) => f.has_watermark === false && f.url
    );
    const pool = withoutWatermark.length > 0 ? withoutWatermark : formats.filter((f) => f.url);

    if (pool.length > 0) {
      const sorted = [...pool].sort((a, b) => {
        const areaA = (a.width || 0) * (a.height || 0);
        const areaB = (b.width || 0) * (b.height || 0);
        return areaB - areaA;
      });

      return {
        url: sorted[0].url,
        hasWatermark: sorted[0].has_watermark ?? true,
      };
    }
  }

  const fallbackUrl = video.downloadAddr?.[0] || video.playAddr?.[0];
  return fallbackUrl ? { url: fallbackUrl, hasWatermark: true } : null;
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 60000,
    headers: FETCH_HEADERS,
  });
  return Buffer.from(res.data);
}

export async function sendTiktok(
  sock: any,
  msg: any,
  args: string[]
): Promise<void> {
  const chatId: string = msg.key.remoteJid;
  const rawText = args.join(" ").trim();
  const url = extractTiktokUrl(rawText);

  if (!url) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❀ Uso incorrecto del comando.\n\n" +
          "Escribe *.tiktok* seguido del enlace del video.\n\n" +
          "Ejemplo:\n*.tiktok https://www.tiktok.com/@usuario/video/1234567890*",
      },
      { quoted: msg }
    );
    return;
  }

  const sent = await sock.sendMessage(
    chatId,
    { text: "❀ Descargando de TikTok..." },
    { quoted: msg }
  );

  try {
    const download = await tiktokClient.downloadVideo(url);

    if (download.status !== "success" || !download.result) {
      await sock.sendMessage(chatId, {
        text: `✦ No se pudo descargar ese video.\n${download.message || ""}`,
        edit: sent?.key,
      });
      return;
    }

    const { result } = download;
    const caption =
      `❀ TikTok descargado ✓\n\n` +
      `✦ Autor › @${result.author.uniqueId || "desconocido"}\n` +
      `◈ Likes › ${formatCount(result.statistics.likeCount)}\n` +
      `◇ Comentarios › ${formatCount(result.statistics.commentCount)}\n` +
      `⌁ Compartidos › ${formatCount(result.statistics.shareCount)}\n\n` +
      (result.desc ? `♧ Descripción › ${result.desc}` : "");

    if (result.type === "video") {
      const format = pickBestFormat(result.video);

      if (!format) {
        await sock.sendMessage(chatId, {
          text: "✦ El video no trajo ninguna URL descargable.",
          edit: sent?.key,
        });
        return;
      }

      const buffer = await fetchBuffer(format.url);

      await sock.sendMessage(
        chatId,
        {
          video: buffer,
          mimetype: "video/mp4",
          caption:
            caption +
            (format.hasWatermark ? "\n\n⚠️ Incluye marca de agua" : ""),
        },
        { quoted: msg }
      );
    } else {
      const images = result.images.slice(0, 10);

      for (let i = 0; i < images.length; i++) {
        const buffer = await fetchBuffer(images[i]);
        await sock.sendMessage(
          chatId,
          {
            image: buffer,
            caption: i === 0 ? caption : undefined,
          },
          { quoted: msg }
        );
      }
    }

    try {
      await sock.sendMessage(chatId, {
        text: "❀ Descarga completada ✓",
        edit: sent?.key,
      });
    } catch {
      await sock.sendMessage(chatId, { text: "❀ Descarga completada ✓" });
    }
  } catch (err: any) {
    console.error("[tiktok] error en sendTiktok:", err);
    await sock.sendMessage(chatId, {
      text: `✦ Ocurrió un error al procesar el video › ${err.message || ""}`,
      edit: sent?.key,
    });
  }
}

export const commands = ["tiktok", "tt", "ttdl"];

export async function run(sock: any, msg: any, args: string[]): Promise<void> {
  await sendTiktok(sock, msg, args);
}
