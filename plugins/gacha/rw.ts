import { getRandomCharacter, isGroupEnabled } from "../../src/libs/gacha";

function buildCaption(character: { name: string; series: string; gender: string; value: number }): string {
  return (
    `🎴 *${character.name}*\n` +
    `⌁ Serie › ${character.series}\n` +
    `⌁ Género › ${character.gender}\n` +
    `⌁ Valor › ${character.value}`
  );
}

async function sendRoll(sock: any, msg: any, chatId: string): Promise<void> {
  const character = getRandomCharacter();

  if (!character) {
    await sock.sendMessage(
      chatId,
      { text: "❌ Todavía no hay personajes cargados. Pide a un admin que use *genchar* o *genrandom*." },
      { quoted: msg }
    );
    return;
  }

  await sock.sendMessage(
    chatId,
    { image: { url: character.image_url }, caption: buildCaption(character) },
    { quoted: msg }
  );
}

export const commands = ["rw"];

export async function run(sock: any, msg: any): Promise<void> {
  const chatId: string = msg.key.remoteJid;

  if (!chatId.endsWith("@g.us")) {
    await sock.sendMessage(chatId, { text: "❌ Este comando solo funciona dentro de un grupo." }, { quoted: msg });
    return;
  }

  if (!isGroupEnabled(chatId)) {
    await sock.sendMessage(
      chatId,
      {
        text: "❌ El gacha no está activado en este grupo. Pide a un administrador que use *gachaconfig* para activarlo.",
      },
      { quoted: msg }
    );
    return;
  }

  await sendRoll(sock, msg, chatId);
}
