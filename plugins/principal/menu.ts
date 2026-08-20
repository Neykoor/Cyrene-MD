import fs from "fs";
import path from "path";
import os from "os";
import sharp from "sharp";
import { fetchRandomPinterestImage } from "../../src/libs/scraper";

function resolveMediaPath(relativePath: string): string | undefined {
  const candidates = [
    path.join(process.cwd(), relativePath),
    path.join(__dirname, "..", relativePath),
    path.join(__dirname, "..", "..", relativePath),
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));

  if (!found) {
    console.error(
      `[menu] no se encontró "${relativePath}". Rutas probadas:\n${candidates.join(
        "\n"
      )}`
    );
  }

  return found;
}

function loadMediaBuffer(relativePath: string): Buffer | undefined {
  const filePath = resolveMediaPath(relativePath);
  return filePath ? fs.readFileSync(filePath) : undefined;
}

let cachedFallbackThumbnail: Buffer | undefined;

async function getLocalFallbackThumbnail(): Promise<Buffer | undefined> {
  if (cachedFallbackThumbnail) return cachedFallbackThumbnail;

  const raw = loadMediaBuffer(global.media.businessThumb);
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
      "[menu] no se pudo traer imagen de Pinterest, uso el fallback local:",
      err
    );

    return getLocalFallbackThumbnail();
  }
}

function formatRAM(): {
  used: string;
  total: string;
} {
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = totalBytes - freeBytes;

  return {
    used: (usedBytes / 1024 / 1024).toFixed(0),
    total: (totalBytes / 1024 / 1024).toFixed(0),
  };
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return `${h}h ${m}m ${s}s`;
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

async function sendMainMenu(
  sock: any,
  msg: any,
  startedAt: number
): Promise<void> {
  const chatId: string = msg.key.remoteJid;

  const isGroup = chatId.endsWith("@g.us");

  const senderJid: string = isGroup
    ? msg.key.participant || msg.key.remoteJid
    : msg.key.remoteJid;

  let groupName = "Chat privado";

  if (isGroup) {
    try {
      const groupMetadata = await sock.groupMetadata(chatId);

      groupName = groupMetadata?.subject || "este grupo";
    } catch (err) {
      console.error(
        "[menu] no se pudo obtener el nombre del grupo:",
        err
      );

      groupName = "este grupo";
    }
  }

  const ram = formatRAM();

  const responseMs = (Date.now() - startedAt).toFixed(2);

  const caption =
    `❀ Hola @${senderJid.split("@")[0]}, soy Cyrene\n` +
    "⌁ Tu asistente virtual\n\n" +
    `♧ Grupo › ${groupName}\n\n` +
    `✦ Ping › ${responseMs} ms\n` +
    `◈ RAM › ${ram.used}/${ram.total} MB\n` +
    `⌂ Uptime › ${formatUptime(process.uptime())}\n` +
    `◇ Kernel › ${os.release()}\n\n` +
    "❖ Pulsa el botón para actualizar";

  const interactiveButtons = [
    {
      name: "quick_reply",

      buttonParamsJson: JSON.stringify({
        display_text: "❀ Menú",
        id: "menu_main",
      }),
    },
  ];

  const content: any = {
    caption,
    subtitle: "𖤐 Asistente Virtual",
    interactiveButtons,
    mentions: [senderJid],

    contextInfo: {
      mentionedJid: [senderJid],
    },
  };

  const menuImage = loadMediaBuffer(global.media.menuCover);

  if (menuImage) {
    content.image = menuImage;
  } else {
    console.error(
      "[menu] enviando menú sin imagen de portada, revisa el log de arriba"
    );
  }

  await sock.sendMessage(chatId, content, {
    quoted: await buildFakeOrderQuote(),
  });
}

export async function sendMenu(
  sock: any,
  msg: any
): Promise<void> {
  const startedAt = Date.now();

  await sendMainMenu(sock, msg, startedAt);
}

export const commands = ["menu", "menú"];

export async function run(sock: any, msg: any): Promise<void> {
  await sendMenu(sock, msg);
}
