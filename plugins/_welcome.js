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

  const date = new Date();
  const fecha = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

  for (const raw of participants) {
    const user = resolveParticipantJid(raw);
    if (!user) continue;

    let name = await conn.getName(user);
    const taguser = '@' + user.split('@')[0];

    if (m.messageStubType === 27 || m.messageStubType === 31) {
      await conn.sendMessage(m.chat, {
        text: `
⟡ \`BIENVENIDA\` ⟡

◈ Usuario: ${taguser}

› Nombre: ${name}
› ID: ${user}
› Fecha: ${fecha}

╭──────────────╮
  Bienvenido al grupo
  ${groupMetadata.subject}
╰──────────────╯

› Lee las reglas del grupo
› Disfruta tu estadía con nosotros.
`,
        mentions: [user]
      });
    }

    if (m.messageStubType === 28 || m.messageStubType === 32) {
      await conn.sendMessage(m.chat, {
        text: `
⟡ \`DESPEDIDA\` ⟡

◈ Usuario: ${taguser}

› Nombre: ${name}
› ID: ${user}
› Fecha: ${fecha}

╭──────────────╮
  Salió del grupo
  ${groupMetadata.subject}
╰──────────────╯

› Gracias por formar parte
› Te deseamos lo mejor.
`,
        mentions: [user]
      });
    }
  }
}
