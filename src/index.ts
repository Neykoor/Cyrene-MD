import chalk from "chalk";
import yargsFactory from "yargs/yargs";
import os from "os";
import path from "path";
import figlet from "figlet";
import fs from "fs";
import readline from "readline";
import pino from "pino";
import "./config";
import { handleCommand } from "./handler";

const { readdirSync, statSync, unlinkSync } = fs;
const { join } = path;

const canalId: string[] = ["120363266665814365@newsletter"];
const canalNombre: string[] = ["🪼 Cyrene Ultra 2.0 BOT 🪼"];

function setupConnection(conn: any): void {
  conn.sendMessage2 = async (chat: string, content: any, m: any, options: any = {}) => {
    const firstChannel = { id: canalId[0], nombre: canalNombre[0] };
    if (content.sticker) {
      return conn.sendMessage(chat, { sticker: content.sticker }, { quoted: m, ...options });
    }
    const messageOptions = {
      ...content,
      mentions: content.mentions || options.mentions || [],
      contextInfo: {
        ...(content.contextInfo || {}),
        forwardedNewsletterMessageInfo: {
          newsletterJid: firstChannel.id,
          serverMessageId: "",
          newsletterName: firstChannel.nombre,
        },
        forwardingScore: 9999999,
        isForwarded: true,
        mentionedJid: content.mentions || options.mentions || [],
      },
    };
    return conn.sendMessage(chat, messageOptions, {
      quoted: m,
      ephemeralExpiration: 86400000,
      disappearingMessagesInChat: 86400000,
      ...options,
    });
  };
}

global.opts = new Object(
  yargsFactory(process.argv.slice(2)).exitProcess(false).parse()
) as Record<string, any>;

async function clearTmp(): Promise<boolean[]> {
  const tmp = [os.tmpdir(), join(__dirname, "./tmp")];
  const filename: string[] = [];
  tmp.forEach((dirname) => {
    if (fs.existsSync(dirname)) readdirSync(dirname).forEach((file) => filename.push(join(dirname, file)));
  });
  return filename.map((file) => {
    const stats = statSync(file);
    if (stats.isFile() && Date.now() - stats.mtimeMs >= 1000 * 60 * 1) {
      unlinkSync(file);
      return true;
    }
    return false;
  });
}

if (!global.opts["test"]) {
  setInterval(async () => {
    if (global.opts["autocleartmp"]) {
      try {
        await clearTmp();
      } catch (e) {
        console.error(e);
      }
    }
  }, 60 * 1000);
}

setInterval(async () => {
  await clearTmp();
  console.log(chalk.cyanBright(`╭━─━─━─≪🔆≫─━─━─━╮\n│SE LIMPIO LA CARPETA TMP CORRECTAMENTE\n╰━─━─━─≪🔆≫─━─━─━╯`));
}, 1000 * 60 * 60);

(async () => {
  const baileysLib: any = await import("baileysxs");
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    downloadContentFromMessage,
  } = baileysLib;

  global.wa = { downloadContentFromMessage };

  const { state, saveCreds } = await useMultiFileAuthState("./sessions");

  console.log(chalk.cyan(figlet.textSync("Cyrene ultra 2.0", { font: "Standard" })));
  console.log(chalk.green("\n✅ Iniciando conexión...\n"));
  console.log(chalk.yellow("📡 ¿Cómo deseas conectarte?\n"));
  console.log(chalk.green("  [1] ") + chalk.white("📷 Escanear código QR"));
  console.log(chalk.green("  [2] ") + chalk.white("🔑 Ingresar código de 8 dígitos\n"));

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = (text: string): Promise<string> => new Promise((resolve) => rl.question(text, resolve));

  let method = "1";
  if (!fs.existsSync("./sessions/creds.json")) {
    method = await question(chalk.magenta("📞 Ingresa tu número (Ej: 5491168XXXX) "));
    if (!["1", "2"].includes(method)) {
      console.log(chalk.red("\n❌ Opción inválida. Reinicia el bot y elige 1 o 2."));
      process.exit(1);
    }
  }

  async function startBot(): Promise<void> {
    try {
      await fetchLatestBaileysVersion();
      const socketSettings = {
        printQRInTerminal: method === "1",
        logger: pino({ level: "silent" }),
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })) },
        browser: method === "1" ? ["CyreneBot", "Safari", "1.0.0"] : ["Ubuntu", "Chrome", "20.0.04"],
      };

      const sock = makeWASocket(socketSettings);
      setupConnection(sock);

      if (!fs.existsSync("./sessions/creds.json") && method === "2") {
        let phoneNumber = await question("😎Fino vamos aya😎: ");
        phoneNumber = phoneNumber.replace(/\D/g, "");
        setTimeout(async () => {
          const code = await sock.requestPairingCode(phoneNumber);
          console.log(chalk.magenta("🔑 Código de vinculación: ") + chalk.yellow(code.match(/.{1,4}/g)!.join("-")));
        }, 2000);
      }

      sock.ev.on("messages.upsert", async (messageUpsert: any) => {
        try {
          const msg = messageUpsert.messages[0];
          if (!msg) return;

          const chatId: string = msg.key.remoteJid;
          const sender: string = msg.key.participant
            ? msg.key.participant.replace(/[^0-9]/g, "")
            : msg.key.remoteJid.replace(/[^0-9]/g, "");
          const botNumber: string = sock.user.id.split(":")[0];
          const fromMe: boolean = msg.key.fromMe || sender === botNumber;
          const messageText: string = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
          const messageType = Object.keys(msg.message || {})[0];

          console.log(chalk.yellow(`\n📩 Nuevo mensaje recibido`));
          console.log(chalk.green(`📨 De: ${fromMe ? "[Tú]" : "[Usuario]"} ${chalk.bold(sender)}`));
          console.log(chalk.cyan(`💬 Tipo: ${messageType}`));
          console.log(chalk.cyan(`💬 Mensaje: ${chalk.bold(messageText || "📂 (Mensaje multimedia)")}`));
          console.log(chalk.gray("──────────────────────────"));

          if (messageText.startsWith(global.prefix)) {
            const command = messageText.slice(global.prefix.length).trim().split(" ")[0];
            const args = messageText.slice(global.prefix.length + command.length).trim().split(" ");
            await handleCommand(sock, msg, command, args, sender);
          }
        } catch (error) {
          console.error("❌ Error en messages.upsert:", error);
        }
      });

      sock.ev.on("connection.update", async (update: any) => {
        const { connection } = update;
        if (connection === "connecting") {
          console.log(chalk.blue("🔄 Conectando a WhatsApp..."));
        } else if (connection === "open") {
          console.log(chalk.green("✅ ¡Conexión establecida con éxito!"));
        } else if (connection === "close") {
          console.log(chalk.red("❌ Conexión cerrada. Intentando reconectar en 5 segundos..."));
          setTimeout(startBot, 5000);
        }
      });

      sock.ev.on("creds.update", saveCreds);

      process.on("uncaughtException", (err) => console.error(chalk.red("⚠️ Error no manejado:"), err));
      process.on("unhandledRejection", (reason, promise) =>
        console.error(chalk.red("🚨 Promesa rechazada sin manejar:"), promise, "razón:", reason)
      );
    } catch (error) {
      console.error(chalk.red("❌ Error en la conexión:"), error);
      console.log(chalk.blue("🔄 Reiniciando en 5 segundos..."));
      setTimeout(startBot, 5000);
    }
  }

  await startBot();
})();
