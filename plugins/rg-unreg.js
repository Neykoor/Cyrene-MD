let handler = async (m, { conn }) => {
  const user = global.db.data.users[m.sender]

  if (!user.registered) {
    return m.reply('❌ No estás registrado.\n\nUsa *.reg Nombre Edad* para registrarte.')
  }

  const nombre = user.name || 'Desconocido'
  const edad = user.age || '???'

  user.registered = false
  user.name = ''
  user.age = 0
  user.regTime = -1
  user.exp = 0
  user.money = 0

  await conn.sendMessage(m.chat, {
    text: `🗑️ *Tu registro fue eliminado correctamente*\n\n👤 Nombre anterior: *${nombre}*\n🎂 Edad: *${edad} años*\n👋 Esperamos verte de nuevo.\n\nEscribe *.reg Nombre Edad* para registrarte otra vez.`,
    mentions: [m.sender]
  }, { quoted: m })
}

handler.command = ['únreg', 'unreg'];
handler.register = true

export default handler