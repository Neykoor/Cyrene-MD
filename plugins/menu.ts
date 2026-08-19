import fs from "fs";
import path from "path";
import os from "os";

const MENU_IMAGE_PATH = path.join(process.cwd(), "src", "media", "menu-cover.jpg");
const BUSINESS_THUMB_PATH = path.join(process.cwd(), "src", "media", "business-thumb.jpg");

const CANAL_ID = "120363426626765423@newsletter";
const CANAL_NOMBRE = "WhatsApp Business";

function formatRAM(): { used: string; total: string } {
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

async function sendBusinessCard(sock: any, chatId: string, quoted: any): Promise<void> {
  const contextInfo: any = {
    isForwarded: true,
    forwardingScore: 9999999,
    forwardedNewsletterMessageInfo: {
      newsletterJid: CANAL_ID,
      serverMessageId: "",
      newsletterName: CANAL_NOMBRE,
    },
    externalAdReplyInfo: {
      title: CANAL_NOMBRE,
      body: "",
      mediaType: 1,
      renderLargerThumbnail: false,
      showAdAttribution: false,
    },
  };

  if (fs.existsSync(BUSINESS_THUMB_PATH)) {
    contextInfo.externalAdReplyInfo.thumbnail = fs.readFileSync(BUSINESS_THUMB_PATH);
  }

  await sock.sendMessage(
    chatId,
    {
      text: "🛒 12 artículos\n🐙 Pedido de Carlos_2take1-interative ✓",
      contextInfo,
    },
    { quoted }
  );
}

async function sendMainMenu(sock: any, chatId: string, msg: any, startedAt: number): Promise<void> {
  const ram = formatRAM();
  const responseMs = (Date.now() - startedAt).toFixed(2);

  const caption =
    "Menú Principal\n\n" +
    "🏷️ 🦠 Bot-Premium | Devs\n\n" +
    "▢ hola soy 2take1-Interative en que te podemos ayudar\nℹ️\n\n" +
    "↝ seleciona una opcion para ser atendidos ↝\n\n" +
    `Interna: ${responseMs} ms\n` +
    `RAM Used: ${ram.used} MB\n` +
    `RAM Total: ${ram.total} MB\n` +
    `Uptime: ${formatUptime(process.uptime())}\n` +
    `Kernel: ${os.release()}`;

  const interactiveButtons = [
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({ display_text: "☰ ATTAÇKE🕷️", id: "menu_attacke" }),
    },
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({ display_text: "☰📋 Menú", id: "menu_main" }),
    },
  ];

  const content: any = {
    caption,
    title: "2take1-Interative",
    subtitle: "🏷️ bot-Menú",
    interactiveButtons,
  };

  if (fs.existsSync(MENU_IMAGE_PATH)) {
    content.image = fs.readFileSync(MENU_IMAGE_PATH);
  }

  await sock.sendMessage(chatId, content, { quoted: msg });
}

export async function sendMenu(sock: any, msg: any): Promise<void> {
  const chatId: string = msg.key.remoteJid;
  const startedAt = Date.now();
  await sendBusinessCard(sock, chatId, msg);
  await sendMainMenu(sock, chatId, msg, startedAt);
}
