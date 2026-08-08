let handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('❌ Este comando solo está disponible en grupos.')

  try {
    const user = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
    const username = await conn.getName(user).catch(() => user.split('@')[0])
    const number = user.split('@')[0]
    const isRegistered = global.db.data.users[user]?.registered ? '✅ Registrado' : '❌ No registrado'

    let profilePicUrl
    try {
      profilePicUrl = await conn.profilePictureUrl(user, 'image')
    } catch (e) {
      profilePicUrl = 'https://files.cloudkuimages.guru/images/7kAcwery.jpg' 
    }

    const caption = `👤 *Perfil de Usuario*\n\n` +
      `📛 Nombre: ${username}\n` +
      `📱 Número: wa.me/${number}\n` +
      `📝 Registro: ${isRegistered}\n\n` +
      `📢 Canal: https://whatsapp.com/channel/0029VajUPbECxoB0cYovo60W\n` +
      `📦 Repositorio: https://github.com/El-brayan502/RoxyBot-MD\n` +
      `🎵 TikTok: https://www.tiktok.com/@fantom_uwu_330`

    await conn.sendMessage(m.chat, {
      image: { url: profilePicUrl },
      caption,
      mentions: [user]
    }, { quoted: m })

    await m.react('👤')
  } catch (e) {
    console.error('Error en plugins/grupo-perfil.js:', e)
    await m.reply('⚠️ No pude generar el perfil. Revisa la consola del bot para ver el error exacto.')
  }
}

handler.help = ['perfil', 'verperfil']
handler.tags = ['info']
handler.command = ['perfil', 'verperfil', 'profile']

export default handler
