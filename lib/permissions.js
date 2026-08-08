export async function resolveSenderNumber(m, conn) {
  let resolved = m.sender
  if (m.sender.includes('@lid') && conn.signalRepository?.lidMapping?.getPNForLID) {
    const pn = await conn.signalRepository.lidMapping.getPNForLID(m.sender).catch(() => null)
    if (pn) resolved = pn
  }
  return resolved
}

export async function getOwnerFlags(m, conn) {
  const resolvedSender = await resolveSenderNumber(m, conn)
  const senderDigits = resolvedSender.replace(/[^0-9]/g, '')

  const isROwner = global.owner.some(([number]) => number.replace(/[^0-9]/g, '') === senderDigits)
  const isOwner = isROwner || m.fromMe
  const isMods = isOwner || global.mods.some(v => v.replace(/[^0-9]/g, '') === senderDigits)

  const dbUser = global.db.data.users[m.sender] || global.db.data.users[resolvedSender]
  const isPrems = isROwner || (dbUser?.premiumTime > 0)

  return { resolvedSender, isROwner, isOwner, isMods, isPrems }
}

export async function getAdminFlags(m, conn, participants) {
  const resolvedSender = await resolveSenderNumber(m, conn)
  const findParticipant = jid => participants.find(p => conn.decodeJid(p.id) === jid)

  let user = m.isGroup ? findParticipant(m.sender) : {}
  if (m.isGroup && !user?.id && resolvedSender !== m.sender) {
    user = findParticipant(resolvedSender)
  }
  user = user || {}

  let numBot = false
  if (conn.user?.lid) numBot = conn.user.lid.replace(/:.*/, '')
  const botJid = m.sender.includes('@lid') ? `${numBot}@lid` : conn.user.jid
  const bot = m.isGroup ? (findParticipant(botJid) || {}) : {}

  const isRAdmin = user.admin === 'superadmin'
  const isAdmin = isRAdmin || user.admin === 'admin'
  const isBotAdmin = !!bot.admin

  return { user, bot, isRAdmin, isAdmin, isBotAdmin }
}
