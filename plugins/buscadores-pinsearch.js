import axios from 'axios';
import baileys from '@whiskeysockets/baileys';

async function sendAlbumMessage(jid, medias, options = {}) {
  if (typeof jid !== "string") throw new TypeError(`😤 ¡Roxy dice que el JID tiene que ser texto!`);
  if (medias.length < 2) throw new RangeError("💢 ¿Dos imágenes mínimo y me traes menos? Por favor...");

  for (const media of medias) {
    if (!['image', 'video'].includes(media.type))
      throw new TypeError(`❌ Tipo inválido: ${media.type}`);
    if (!media.data || (!media.data.url && !Buffer.isBuffer(media.data)))
      throw new TypeError(`🌀 ¡Necesito datos válidos en las imágenes, cariño!`);
  }

  const caption = options.text || options.caption || "";
  const delay = !isNaN(options.delay) ? options.delay : 500;

  const album = baileys.generateWAMessageFromContent(
    jid,
    {
      messageContextInfo: {},
      albumMessage: {
        expectedImageCount: medias.filter(m => m.type === "image").length,
        expectedVideoCount: medias.filter(m => m.type === "video").length,
        ...(options.quoted
          ? {
              contextInfo: {
                remoteJid: options.quoted.key.remoteJid,
                fromMe: options.quoted.key.fromMe,
                stanzaId: options.quoted.key.id,
                participant: options.quoted.key.participant || options.quoted.key.remoteJid,
                quotedMessage: options.quoted.message,
              },
            }
          : {}),
      },
    },
    {}
  );

  await conn.relayMessage(album.key.remoteJid, album.message, { messageId: album.key.id });

  for (let i = 0; i < medias.length; i++) {
    const { type, data } = medias[i];
    const img = await baileys.generateWAMessage(
      album.key.remoteJid,
      { [type]: data, ...(i === 0 ? { caption } : {}) },
      { upload: conn.waUploadToServer }
    );
    img.message.messageContextInfo = {
      messageAssociation: { associationType: 1, parentMessageKey: album.key },
    };
    await conn.relayMessage(img.key.remoteJid, img.message, { messageId: img.key.id });
    await baileys.delay(delay);
  }

  return album;
}

const PINTEREST_API_URL = 'https://anime-xi-wheat.vercel.app/api/pinterest'; // ⚠️ Reemplaza esta URL si vuelve a caerse

const pins = async (query) => {
  try {
    const res = await axios.get(`${PINTEREST_API_URL}?q=${encodeURIComponent(query)}`, { timeout: 15000 });
    if (Array.isArray(res.data?.images)) {
      return res.data.images.map(url => ({
        image_large_url: url,
        image_medium_url: url,
        image_small_url: url
      }));
    }
    return [];
  } catch (err) {
    if (err.response) {
      console.error(`💥 Pinterest API respondió ${err.response.status}: ${PINTEREST_API_URL}`);
    } else {
      console.error('💥 Error fetching pins:', err.message);
    }
    return [];
  }
};

let handler = async (m, { conn, text }) => {
  const dev = 'Brayan 💫';
  const botname = 'Roxy-Bot 🔥';

  if (!text) {
    return conn.reply(m.chat, `💄 *¿Qué esperás, papi?* ¡Escribí lo que querés buscar!\n\n✨ *Ejemplo:* .pinterest anime girl`, m);
  }

  try {
    await m.react('🔍');
    const results = await pins(text);
    if (!results.length) return conn.reply(m.chat, `🙄 No encontré nada con *${text}*, o la API de Pinterest no está respondiendo ahora mismo. Probá de nuevo en un rato.`, m);

    const max = Math.min(results.length, 15);
    const medias = [];

    for (let i = 0; i < max; i++) {
      medias.push({
        type: 'image',
        data: {
          url: results[i].image_large_url || results[i].image_medium_url || results[i].image_small_url
        }
      });
    }

    await sendAlbumMessage(m.chat, medias, {
      caption: `💋 *Roxy te trajo esto, mi amor:*\n📌 *Búsqueda:* ${text}\n🖼️ *Resultados:* ${max}\n🎀 *By:* ${dev}`,
      quoted: m
    });

    await conn.sendMessage(m.chat, { react: { text: '🌹', key: m.key } });

  } catch (e) {
    console.error(e);
    return conn.reply(m.chat, '🤬 ¡Algo falló, mi cielo! Pinterest se hizo la difícil...', m);
  }
};

handler.help = ['pinterest'];
handler.command = ['pinterest', 'pin'];
handler.tags = ['buscador'];
handler.register = true;

export default handler;
