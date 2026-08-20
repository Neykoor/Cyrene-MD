import { sendMenu } from "../plugins/menu";
import { sendPing } from "../plugins/ping";
import { sendSticker } from "../plugins/sticker";
import { sendPinterestImage } from "../plugins/pinterest";
import { sendPlay } from "../plugins/play";

export async function handleCommand(
  sock: any,
  msg: any,
  command: string,
  args: string[],
  sender: string
): Promise<void> {
  console.log(`[handler] Comando recibido: ${command} | args: ${args.join(" ")} | de: ${sender}`);

  const cmd = command.toLowerCase();

  if (cmd === "menu" || cmd === "menú") {
    await sendMenu(sock, msg);
  }

  if (cmd === "p" || cmd === "ping") {
    await sendPing(sock, msg);
  }

  if (cmd === "s" || cmd === "sticker") {
    await sendSticker(sock, msg);
  }

  if (cmd === "pin" || cmd === "pinterest") {
    await sendPinterestImage(sock, msg, args);
  }

if (cmd === "play" || cmd === "yt" || cmd === "yta") {
    await sendPlay(sock, msg, args.join(" ").trim());
  }
}

export async function handleButtonClick(
  sock: any,
  msg: any,
  buttonId: string
): Promise<void> {
  console.log(`[handler] Botón presionado: ${buttonId}`);

  if (buttonId === "menu_main") {
    await sendMenu(sock, msg);
  }
}
