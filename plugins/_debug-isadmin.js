const handler = async (m, {
  conn,
  participants,
  groupMetadata,
  user,
  isRAdmin,
  isAdmin,
  isBotAdmin,
  isOwner,
  isROwner
}) => {
  if (!m.isGroup) {
    return m.reply('❌ Este comando solo funciona dentro de un grupo.')
  }

  const senderRaw = m.sender
  const senderDecoded = conn.decodeJid(m.sender)

  const foundByRaw = participants.find(p => p.id === senderRaw)
  const foundByDecoded = participants.find(p => conn.decodeJid(p.id) === senderDecoded)

  const infoUserObj = user && Object.keys(user).length
    ? `id: ${user.id}\nadmin: ${user.admin || 'null (no es admin)'}`
    : '⚠️ No se encontró el objeto "user" (no hizo match en participants)'

  const texto = `🔍 *DEBUG · Detección de Admin*
━━━━━━━━━━━━━━━━━━━━━━
👤 *m.sender:* ${senderRaw}
👤 *decodeJid(m.sender):* ${senderDecoded}

📋 *Objeto "user" (handler.js):*
${infoUserObj}

🔎 *Búsqueda manual en participants:*
› Por m.sender directo: ${foundByRaw ? `✅ encontrado (admin: ${foundByRaw.admin || 'null'})` : '❌ no encontrado'}
› Por decodeJid: ${foundByDecoded ? `✅ encontrado (admin: ${foundByDecoded.admin || 'null'})` : '❌ no encontrado'}

⚙️ *Resultados finales:*
› isRAdmin (superadmin): ${isRAdmin ? '✅ true' : '❌ false'}
› isAdmin (admin o superadmin): ${isAdmin ? '✅ true' : '❌ false'}
› isBotAdmin: ${isBotAdmin ? '✅ true' : '❌ false'}
› isOwner: ${isOwner ? '✅ true' : '❌ false'}
› isROwner: ${isROwner ? '✅ true' : '❌ false'}

👥 *Total participantes en metadata:* ${participants.length}
━━━━━━━━━━━━━━━━━━━━━━
${isAdmin ? '✅ El bot SÍ te detecta como administrador.' : '❌ El bot NO te detecta como administrador.'}`

  return m.reply(texto)
}

handler.command = ['soyadmin', 'checkadmin', 'debugadmin']
handler.group = true
handler.tags = ['group', 'debug']
handler.help = ['soyadmin']

export default handler
