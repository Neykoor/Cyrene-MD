import fs from "fs";
import { writeExif } from "../src/libs/fuctions";

interface MediaTarget {
  type: "image" | "video";
  media: any;
  mimetype: string;
}

function getMediaMessage(msg: any): MediaTarget | null {
  const message = msg.message || {};
  const quoted = message.extendedTextMessage?.contextInfo?.quotedMessage;

  if (message.imageMessage) {
    return {
      type: "image",
      media: message.imageMessage,
      mimetype: message.imageMessage.mimetype || "image/jpeg",
    };
  }

  if (message.videoMessage) {
    return {
      type: "video",
      media: message.videoMessage,
      mimetype: message.videoMessage.mimetype || "video/mp4",
    };
  }

  if (quoted?.imageMessage) {
    return {
      type: "image",
      media: quoted.imageMessage,
      mimetype: quoted.imageMessage.mimetype || "image/jpeg",
    };
  }

  if (quoted?.videoMessage) {
    return {
      type: "video",
      media: quoted.videoMessage,
      mimetype: quoted.videoMessage.mimetype || "video/mp4",
    };
  }

  return null;
}

async function downloadMedia(media: any, type: "image" | "video"): Promise<Buffer> {
  const stream = await global.wa.downloadContentFromMessage(media, type);
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  return buffer;
}

export async function sendSticker(sock: any, msg: any): Promise<void> {
  const chatId: string = msg.key.remoteJid;
  const target = getMediaMessage(msg);

  if (!target) {
    await sock.sendMessage(
      chatId,
      { text: "📎 Envía o responde a una imagen, video o gif con .s para convertirlo en sticker." },
      { quoted: msg }
    );
    return;
  }

  try {
    const buffer = await downloadMedia(target.media, target.type);

    const outPath = await writeExif(
      { mimetype: target.mimetype, data: buffer },
      { packname: "Cyrene", author: "Cyrene-MD" }
    );

    if (!outPath) {
      await sock.sendMessage(chatId, { text: "❌ No se pudo generar el sticker." }, { quoted: msg });
      return;
    }

    const stickerBuffer = fs.readFileSync(outPath);
    fs.unlinkSync(outPath);

    await sock.sendMessage(chatId, { sticker: stickerBuffer }, { quoted: msg });
  } catch (err: any) {
    await sock.sendMessage(
      chatId,
      { text: `❌ Error al crear el sticker.\n${err.message}` },
      { quoted: msg }
    );
  }
}
