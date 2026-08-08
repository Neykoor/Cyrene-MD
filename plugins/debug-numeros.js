import { resolveSenderNumber } from '../lib/permissions.js'

const handler = async (m, { conn, participants, groupMetadata }) => {
  if (!m.isGroup) {
    return m.reply('❌ Este comando solo funciona dentro de un grupo.')
  }

  let numBot = false
  if (conn.user?.lid) numBot = conn.user.lid.replace(/:.*/, '')
  const botJid = m.sender.includes('@lid') ? `${numBot}@lid` : conn.user.jid
  const botDecoded = conn.decodeJid(botJid)

  let lines = []
  let totalAdmins = 0
  let totalLid = 0
  let sinResolver = 0

  for (const p of participants) {
    const rawId = p.id
    const decoded = conn.decodeJid(rawId)
    const esLid = rawId.includes('@lid')
    const esAdmin = !!p.admin
    const esSuperAdmin = p.admin === 'superadmin'
    const esBot = decoded === botDecoded

    let numeroReal = null
    let notaResolucion = ''
    if (esLid) {
      totalLid++
      try {
        const pn = await conn.signalRepository?.lidMapping?.getPNForLID?.(rawId).catch(() => null)
        if (pn) {
          numeroReal = pn.split('@')[0]
        } else {
          notaResolucion = ' ⚠️ no se pudo mapear @lid → número'
          sinResolver++
        }
      } catch {
        notaResolucion = ' ⚠️ error al mapear @lid'
        sinResolver++
      }
    }

    if (esAdmin) totalAdmins++

    const rol = esSuperAdmin ? '👑 superadmin' : esAdmin ? '🛡️ admin' : '👤 miembro'
    const marcaBot = esBot ? ' 🤖 (soy yo)' : ''

    lines.push(
      `• ${rol}${marcaBot}\n` +
      `  id crudo: ${rawId}\n` +
      `  decodeJid: ${decoded}` +
      (esLid ? `\n  tipo: @lid${numeroReal ? ` → resuelto a ${numeroReal}` : notaResolucion}` : '\n  tipo: número directo')
    )
  }

  const senderResolved = await resolveSenderNumber(m, conn)

  const texto = `🔍 *DEBUG · Detección de números y admins*
━━━━━━━━━━━━━━━━━━━━━━
👥 Participantes totales: ${participants.length}
🛡️ Detectados como admin: ${totalAdmins}
🔗 Usando formato @lid: ${totalLid}${sinResolver ? ` (⚠️ ${sinResolver} sin poder resolver a número)` : ''}

📌 *Quién ejecutó el comando:*
› m.sender: ${m.sender}
› número resuelto: ${senderResolved}

📋 *Detalle por participante:*
${lines.join('\n\n')}
━━━━━━━━━━━━━━━━━━━━━━
💡 Si algún admin real aparece como "👤 miembro", probablemente WhatsApp está entregando su id en formato @lid y no se está pudiendo mapear a su número — revisa la nota ⚠️ junto a ese participante.`

  return m.reply(texto)
}

handler.command = ['debugnumeros', 'listaadmins', 'checkadmins']
handler.group = true
handler.tags = ['group', 'debug']
handler.help = ['debugnumeros']

export default handler
