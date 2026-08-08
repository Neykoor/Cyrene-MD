import { watchFile, unwatchFile } from 'fs' 
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone' 

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

// ᑕOᒪᗩᗷOᖇᗩᗪOᖇᗴՏ Y ᑕᖇᗴáᗪOᖇ 🌸
global.owner = [
['', '', true],
];

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

// ᑎᑌᗰᗴᖇO ᗪᗴ OᗯᑎᗴᖇՏ ✨️
global.mods = [''];
global.suittag = [''];
global.prems = [''];

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

// IᑎᖴOᖇᗰᗩᑕIOᑎ ՏOᗷᖇᗴ ᒪᗩ ᗷOT 🍁
global.libreria = 'Baileys';
global.nameqr = 'RoxyBot';
global.namebot = 'RoxyBot';
global.sessions = 'Sessions';
global.jadi = 'JadiBots';
global.roxyJadibts = true;

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

// ᗰᗩᖇᑕᗩ ᗪᗴ ᗩᘜᑌᗩ 🗞️
global.packname = '𝗥𝗼𝘅𝘆-𝗠𝗗 (𝗠𝘂𝗹𝘁𝗶-𝗗𝗲𝘃𝗶𝗰𝗲)';
global.botname = '🌸◌*̥₊ Rᴏxʏ-Mᴅ ◌❐🎋༉';
global.wm = '🌸◌*̥₊ Tʜᴇ Rᴏxʏ-Bᴏᴛ ◌❐🎋༉';
global.dev = '❁ཻུ۪۪ ⎧ ୧ㅤ 𝘉𝘳𝘢𝘺𝘢𝘯ㅤ🎋⋅ ..⃗.';
global.textbot = 'Rᴏxʏ-Mᴅ Bʏ BʀᴀʏᴀɴXᴅ';
global.etiqueta = 'Rᴏxʏ-Mᴅ Wʜᴀᴛsᴀᴀᴘ Bᴏᴛ';

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

// ᗰOᑎᗴᗪᗩՏ 💸
global.moneda = 'dolares';

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

// Iᗰᗩᘜ3ᑎᗴՏ ᑎO TOᑕᗩᖇ 📥
global.catalogo = fs.readFileSync('./src/catalogo.jpg');
global.photoSity = [catalogo]

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

// ᘜᖇᑌᑭOՏ ᗪᗴ ᒪᗩ ᗷOT 🗂️
global.gp1 = ''
global.channel2 = ''
global.md = ''
global.correo = ''
global.cn ='';

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

global.catalogo = fs.readFileSync('./src/catalogo.jpg');
global.estilo = { key: {  fromMe: false, participant: `0@s.whatsapp.net`, ...(false ? { remoteJid: "5219992095479-1625305606@g.us" } : {}) }, message: { orderMessage: { itemCount : -999999, status: 1, surface : 1, message: packname, orderTitle: 'Bang', thumbnail: catalogo, sellerJid: '0@s.whatsapp.net'}}}
global.ch = {
ch1: '',
}

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

global.APIKeys = {};

//✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})
