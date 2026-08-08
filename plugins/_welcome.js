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
╭━━━〔 ✦ \`BIENVENIDA\` ✦ 〕━━━╮

  Bienvenido a la familia, ${taguser}

  Nos alegra mucho tenerte
  como nuevo miembro del grupo.

╰━━━━━━━━━━━━━━━━━━╯

╭━━〔 INFORMACIÓN 〕━━╮

› Nombre: ${name}
› Usuario: ${user}
› Fecha: ${fecha}

╰━━━━━━━━━━━━━━━━━━╯

⟡ Grupo:
${groupMetadata.subject}

◈ Esperamos que disfrutes tu
estadía, compartas buenos momentos
y formes parte de esta comunidad.

› Recuerda leer las reglas
› Respeta a los demás miembros
› Diviértete y participa

╭━━━━━━━━━━━━━━━━━━╮
  Gracias por unirte
  a nuestra comunidad.
╰━━━━━━━━━━━━━━━━━━╯
`,
        mentions: [user]
      });
    }

    if (m.messageStubType === 28 || m.messageStubType === 32) {
      await conn.sendMessage(m.chat, {
        text: `
╭━━━〔 ✦ \`DESPEDIDA\` ✦ 〕━━━╮

  Hasta pronto, ${taguser}

  Un miembro de nuestra comunidad
  ha decidido continuar su camino.

╰━━━━━━━━━━━━━━━━━━╯

╭━━〔 INFORMACIÓN 〕━━╮

› Nombre: ${name}
› Usuario: ${user}
› Fecha: ${fecha}

╰━━━━━━━━━━━━━━━━━━╯

⟡ Grupo:
${groupMetadata.subject}

◈ Gracias por los momentos
compartidos dentro del grupo.

› Siempre tendrás las puertas
abiertas para volver.

╭━━━━━━━━━━━━━━━━━━╮
  Te deseamos lo mejor
  en tu próximo camino.
╰━━━━━━━━━━━━━━━━━━╯
`,
        mentions: [user]
      });
    }
  }
}
