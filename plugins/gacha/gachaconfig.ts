import { isOwner } from "../../config";
import { isSenderGroupAdmin } from "../../src/libs/group";
import { isGroupEnabled, setGroupEnabled } from "../../src/libs/gacha";

export const commands = ["gachaconfig"];

export async function run(sock: any, msg: any, args: string[], sender: string): Promise<void> {
  const chatId: string = msg.key.remoteJid;

  if (!chatId.endsWith("@g.us")) {
    await sock.sendMessage(chatId, { text: "❌ Este comando solo funciona dentro de un grupo." }, { quoted: msg });
    return;
  }

  const allowed = isOwner(sender) || (await isSenderGroupAdmin(sock, chatId, sender));
  if (!allowed) {
    await sock.sendMessage(
      chatId,
      { text: "❌ Solo un administrador del grupo puede configurar el gacha." },
      { quoted: msg }
    );
    return;
  }

  const option = (args[0] || "").toLowerCase();

  if (option === "off" || option === "desactivar") {
    setGroupEnabled(chatId, false, sender);
    await sock.sendMessage(chatId, { text: "🔴 Gacha desactivado en este grupo." }, { quoted: msg });
    return;
  }

  if (option === "on" || option === "activar" || !option) {
    const alreadyEnabled = isGroupEnabled(chatId);
    setGroupEnabled(chatId, true, sender);
    await sock.sendMessage(
      chatId,
      {
        text: alreadyEnabled
          ? "✅ El gacha ya estaba activo en este grupo."
          : "✅ Gacha activado en este grupo. Ya pueden usar *rw* para tirar personajes.",
      },
      { quoted: msg }
    );
    return;
  }

  await sock.sendMessage(chatId, { text: "❌ Uso: gachaconfig on | off" }, { quoted: msg });
}
