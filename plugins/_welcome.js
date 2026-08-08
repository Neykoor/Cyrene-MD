function resolveParticipantJid(raw) {
  let obj = raw;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();

    if (trimmed.startsWith('{')) {
      try {
        obj = JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    } else {
      return trimmed;
    }
  }

  if (obj && typeof obj === 'object') {
    return obj.phoneNumber || obj.id || obj.jid || obj.lid || null;
  }

  return null;
}

export async function before(m, { conn }) {
  if (!m.isGroup || !m.messageStubType || !m.messageStubParameters) return;

  if (!db.data.chats[m.chat].welcome) return;

  const groupMetadata = await conn.groupMetadata(m.chat);
  const participants = m.messageStubParameters || [];

  for (const raw of participants) {
    const user = resolveParticipantJid(raw);
    if (!user) continue;

    const taguser = '@' + user.split('@')[0];

    if (m.messageStubType === 27 || m.messageStubType === 31) {
      await conn.sendMessage(m.chat, {
        text: `_⟡ ¡Bienvenido ${taguser} al grupo *${groupMetadata.subject}*!_

⌁ Miembros: \`${groupMetadata.participants.length}\`

> Por favor, lee las reglas y disfruta tu estadía.`,
        mentions: [user]
      });
    }

    if (m.messageStubType === 28 || m.messageStubType === 32) {
      await conn.sendMessage(m.chat, {
        text: `_⟡ ¡Hasta pronto ${taguser}!_

⌁ Miembros: \`${groupMetadata.participants.length}\`

> Gracias por formar parte de *${groupMetadata.subject}*. Te deseamos lo mejor.`,
        mentions: [user]
      });
    }
  }
}
