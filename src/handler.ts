import { sendMenu } from "../plugins/menu";
import { sendPing } from "../plugins/ping";

export async function handleCommand(
  sock: any,
  msg: any,
  command: string,
  args: string[],
  sender: string,
  startedAt: number = Date.now()
): Promise<void> {
  console.log(`[handler] Comando recibido: ${command} | args: ${args.join(" ")} | de: ${sender}`);

  const cmd = command.toLowerCase();

  if (cmd === "menu" || cmd === "menú") {
    await sendMenu(sock, msg);
  }

  if (cmd === "p" || cmd === "ping") {
    await sendPing(sock, msg, startedAt);
  }
}
