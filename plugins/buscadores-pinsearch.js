import axios from 'axios'
import { generateWAMessageFromContent, generateWAMessage, delay } from '@whiskeysockets/baileys'

async function sendAlbumMessage(conn, jid, medias, options = {}) {
  if (typeof jid !== 'string') throw new TypeError(`jid must be string, received: ${jid}`)
  if (medias.length < 2) throw new RangeError('Se necesitan al menos 2 imágenes para un álbum')

  const caption = options.caption || options.text || ''
  const delayMs = !isNaN(options.delay) ? options.delay : 500

  const album = generateWAMessageFromContent(
    jid,
    {
      messageContextInfo: {},
      albumMessage: { expectedImageCount: medias.length },
    },
    {}
  )

  await conn.relayMessage(album.key.remoteJid, album.message, {
    messageId: album.key.id,
  })

  for (let i = 0; i < medias.length; i++) {
    const { type, data } = medias[i]

    const mediaMsg = await generateWAMessage(
      album.key.remoteJid,
      { [type]: data, ...(i === 0 ? { caption } : {}) },
      { upload: conn.waUploadToServer }
    )

    mediaMsg.message.messageContextInfo = {
      messageAssociation: {
        associationType: 1,
        parentMessageKey: album.key,
      },
    }

    await conn.relayMessage(mediaMsg.key.remoteJid, mediaMsg.message, {
      messageId: mediaMsg.key.id,
    })

    await delay(delayMs)
  }

  return album
}

const PALABRAS_PROHIBIDAS = [
  'porn', 'hentai', 'xxx', 'nsfw', 'desnudo',
  'nude', 'erotic', 'porno', 'culo',
  'tetas', 'culos', 'sexo',
]

async function searchPinterest(query) {
  const link =
    `https://id.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}%26rs%3Dtyped&data=%7B%22options%22%3A%7B%22applied_unified_filters%22%3Anull%2C%22appliedProductFilters%22%3A%22---%22%2C%22article%22%3Anull%2C%22auto_correction_disabled%22%3Afalse%2C%22corpus%22%3Anull%2C%22customized_rerank_type%22%3Anull%2C%22domains%22%3Anull%2C%22dynamicPageSizeExpGroup%22%3A%22control%22%2C%22filters%22%3Anull%2C%22journey_depth%22%3Anull%2C%22page_size%22%3Anull%2C%22price_max%22%3Anull%2C%22price_min%22%3Anull%2C%22query_pin_sigs%22%3Anull%2C%22query%22%3A%22${encodeURIComponent(query)}%22%2C%22redux_normalize_feed%22%3Atrue%2C%22request_params%22%3Anull%2C%22rs%22%3A%22typed%22%2C%22scope%22%3A%22pins%22%2C%22selected_one_bar_modules%22%3Anull%2C%22seoDrawerEnabled%22%3Afalse%2C%22source_id%22%3Anull%2C%22source_module_id%22%3Anull%2C%22source_url%22%3A%22%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}%26rs%3Dtyped%22%2C%22top_pin_id%22%3Anull%2C%22top_pin_ids%22%3Anull%7D%2C%22context%22%3A%7B%7D%7D`

  const headers = {
    'accept':                    'application/json, text/javascript, */*; q=0.01',
    'accept-language':           'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'referer':                   'https://id.pinterest.com/',
    'user-agent':                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    'x-app-version':             'c056fb7',
    'x-pinterest-appstate':      'active',
    'x-pinterest-pws-handler':   'www/index.js',
    'x-pinterest-source-url':    '/',
    'x-requested-with':          'XMLHttpRequest',
  }

  const res = await axios.get(link, { headers })
  const results = res.data?.resource_response?.data?.results

  if (!results?.length) return []

  return results
    .map((item) => {
      if (!item.images) return null
      return {
        hd:   item.images.orig?.url         || '',
        mini: item.images['236x']?.url      || '',
      }
    })
    .filter(Boolean)
}

let handler = async (message, { conn, text, usedPrefix, command }) => {
  if (!text)
    return conn.reply(message.chat, `*📌 Uso Correcto:* ${usedPrefix + command} Akame`, message, rcanal)

  const chatData = global.db.data.chats[message.chat]
  if (message.isGroup && !chatData?.nsfw) {
    if (PALABRAS_PROHIBIDAS.some((w) => text.toLowerCase().includes(w)))
      return conn.reply(message.chat, '🚩 *¡Esto está prohibido en el Grupo!*', message, rcanal)
  }

  await message.react('📌')
  await conn.reply(message.chat, '📌 *Descargando imágenes de Pinterest...*', message, rcanal)

  try {
    const data = await searchPinterest(text)

    if (data.length < 2)
      return conn.reply(message.chat, '❌ No se encontraron suficientes imágenes para un álbum.', message, rcanal)

    const images = data
      .slice(0, 10)
      .map((img) => ({
        type: 'image',
        data: { url: img.hd || img.mini },
      }))

    await sendAlbumMessage(conn, message.chat, images, {
      caption: `📌 *Resultados de búsqueda para:* ${text}`,
    })

    await message.react('✅')
  } catch (err) {
    console.error(err)
    await conn.reply(message.chat, `⚠️ Error al obtener imágenes de Pinterest.\n${err.message}`, message, rcanal)
  }
}

handler.help = ['pinterest <texto>', 'pin <texto>']
handler.tags = ['buscador']
handler.command = ['pinterest', 'pin']
handler.register = true

export default handler
