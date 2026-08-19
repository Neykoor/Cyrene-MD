import { sendMenu } from "../plugins/menu";

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
}
