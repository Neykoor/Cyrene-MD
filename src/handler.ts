import { sendMenu } from "../plugins/principal/menu";
import { downloadAndSend } from "../plugins/descargas/play";
import { handleGenCharButton } from "../plugins/gacha/genchar";
import { loadPlugins, getCommandHandler } from "./pluginLoader";

loadPlugins();

export async function handleCommand(
  sock: any,
  msg: any,
  command: string,
  args: string[],
  sender: string
): Promise<void> {
  console.log(`[handler] Comando recibido: ${command} | args: ${args.join(" ")} | de: ${sender}`);

  const cmd = command.toLowerCase();
  const run = getCommandHandler(cmd);

  if (run) {
    await run(sock, msg, args, sender);
  }
}

export async function handleButtonClick(
  sock: any,
  msg: any,
  buttonId: string
): Promise<void> {
  console.log(`[handler] Botón presionado: ${buttonId}`);

  if (buttonId.startsWith("play_mp3_") || buttonId.startsWith("play_mp4_")) {
    const isVideo = buttonId.startsWith("play_mp4_");
    const prefix = isVideo ? "play_mp4_" : "play_mp3_";
    const url = decodeURIComponent(buttonId.slice(prefix.length));

    if (!/^https?:\/\/\S+/i.test(url)) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "✦ Enlace no válido, vuelve a probar con .play",
      });
      return;
    }

    await downloadAndSend(sock, msg, url, isVideo ? "mp4" : "mp3");
    return;
  }

  if (buttonId === "menu_main") {
    await sendMenu(sock, msg);
    return;
  }

  if (buttonId.startsWith("genchar_rating_")) {
    await handleGenCharButton(sock, msg, buttonId);
  }
}
