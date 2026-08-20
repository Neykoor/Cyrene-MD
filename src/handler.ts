import { sendMenu } from "../plugins/menu";
import { sendPing } from "../plugins/ping";
import { sendSticker } from "../plugins/sticker";

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
}

export async function handleButtonClick(
  sock: any,
  msg: any,
  buttonId: string
): Promise<void> {
  console.log(`[handler] Botón presionado: ${buttonId}`);

  if (buttonId === "menu_ping") {
    await sendPing(sock, msg);
  }

  if (buttonId === "menu_main") {
    await sendMenu(sock, msg);
  }
}
