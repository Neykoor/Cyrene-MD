var handler = async (m, { conn, participants, isROwner }) => {
  const pikachu = 'Ｏ(≧∇≦)Ｏ⚡';
  const sadchu = 'Ｏ(≧∇≦)Ｏ🔋';

  if (!isROwner) {
    return conn.reply(m.chat, `${sadchu} ¡Solo el owner principal puede usar este comando!`, m);
  }

  const groupInfo = await conn.groupMetadata(m.chat);
  const ownerGroup = groupInfo.owner || m.chat.split`-`[0] + '@s.whatsapp.net';
  const botJid = conn.user.jid;

  const membersToRemove = participants
    .map(p => p.id)
    .filter(id => id !== botJid && id !== ownerGroup && id !== m.sender);

  if (membersToRemove.length === 0) {
    return conn.reply(m.chat, `${sadchu} No hay miembros para eliminar del grupo.`, m);
  }

  // Mensaje inicial
  await conn.reply(m.chat, `${pikachu} ¡RAMO DM ACTIVADO!\n\n⚠ Eliminando ${membersToRemove.length} miembros del grupo...`, m);

  try {
    for (let i = 0; i < membersToRemove.length; i++) {
      try {
        await conn.groupParticipantsUpdate(m.chat, [membersToRemove[i]], 'remove');
        await new Promise(resolve => setTimeout(resolve, 1000)); // espera 1 segundo
      } catch (error) {
        console.log(`Error eliminando usuario ${membersToRemove[i]}:`, error);
      }
    }

    await conn.reply(m.chat, `${pikachu} ¡RAMO DM FINALIZADO!\n\n⚡ Se eliminaron todos los miembros del grupo.`, m);

  } catch (error) {
    console.error('Error en ramo dm:', error);
    await conn.reply(m.chat, `${sadchu} Hubo un error durante la eliminación: ${error.message}`, m);
  }
};

handler.help = ['ramodm'];
handler.tags = ['grupo'];
handler.command = ['ramodm'];
handler.rowner = true;
handler.group = true;
handler.botAdmin = true;

export default handler;