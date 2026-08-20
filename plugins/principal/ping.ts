export async function sendPing(sock: any, msg: any): Promise<void> {
  const chatId: string = msg.key.remoteJid;

  const t0 = Date.now();
  await sock.sendMessage(chatId, { text: "🏓 Pong!" }, { quoted: msg });
  const responseMs = (Date.now() - t0).toFixed(2);

  await sock.sendMessage(chatId, { text: `⌁ Velocidad: ${responseMs} ms` }, { quoted: msg });
}

export const commands = ["p", "ping"];

export async function run(sock: any, msg: any): Promise<void> {
  await sendPing(sock, msg);
}
