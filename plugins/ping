export async function sendPing(
  sock: any,
  msg: any,
  startedAt: number
): Promise<void> {
  const chatId: string = msg.key.remoteJid;

  const responseMs = (Date.now() - startedAt).toFixed(2);

  await sock.sendMessage(
    chatId,
    { text: `🏓 *Pong!*\n⌁ Velocidad: ${responseMs} ms` },
    { quoted: msg }
  );
}
