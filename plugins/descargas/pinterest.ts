import { getRandomPinterestImage } from "../../src/libs/scraper";

export async function sendPinterestImage(
  sock: any,
  msg: any,
  args: string[]
): Promise<void> {
  const chatId: string = msg.key.remoteJid;

  const query = args.join(" ").trim();

  if (!query) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "📌 Uso incorrecto del comando.\n\n" +
          "Escribe *.pin* seguido de lo que quieras buscar.\n\n" +
          "Ejemplo:\n*.pin cyrene*",
      },
      { quoted: msg }
    );
    return;
  }

  try {
    const { buffer } = await getRandomPinterestImage(query);

    await sock.sendMessage(
      chatId,
      {
        image: buffer,
        caption: `📌 Resultado para: *${query}*`,
      },
      { quoted: msg }
    );
  } catch (err: any) {
    await sock.sendMessage(
      chatId,
      {
        text: `❌ No se encontraron imágenes para "${query}".\n${err.message || ""}`,
      },
      { quoted: msg }
    );
  }
}

export const commands = ["pin", "pinterest"];

export async function run(sock: any, msg: any, args: string[]): Promise<void> {
  await sendPinterestImage(sock, msg, args);
}
