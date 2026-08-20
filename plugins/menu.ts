import fs from "fs";
import path from "path";
import os from "os";

function resolveMediaPath(filename: string): string | undefined {
  const candidates = [
    path.join(__dirname, "..", "..", "src", "media", filename),
    path.join(__dirname, "..", "src", "media", filename),
    path.join(process.cwd(), "src", "media", filename),
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));

  if (!found) {
    console.error(`[menu] no se encontro "${filename}". Rutas probadas:\n${candidates.join("\n")}`);
  }

  return found;
}

function loadMediaBuffer(filename: string): Buffer | undefined {
  const filePath = resolveMediaPath(filename);
  return filePath ? fs.readFileSync(filePath) : undefined;
}

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

function buildFakeOrderQuote(): any {
  const thumbnail = loadMediaBuffer("business-thumb.jpg");
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
        orderTitle: "Pedido de Carlos_2take1-interative ✓",
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

async function sendMainMenu(sock: any, chatId: string, startedAt: number): Promise<void> {
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
    interactiveAsTemplate: true,
  };

  const menuImage = loadMediaBuffer("menu-cover.jpg");
  if (menuImage) {
    content.image = menuImage;
  } else {
    console.error("[menu] enviando menu sin imagen de portada, revisa el log de arriba");
  }

  await sock.sendMessage(chatId, content, { quoted: buildFakeOrderQuote() });
}

export async function sendMenu(sock: any, msg: any): Promise<void> {
  const chatId: string = msg.key.remoteJid;
  const startedAt = Date.now();
  await sendMainMenu(sock, chatId, startedAt);
}
