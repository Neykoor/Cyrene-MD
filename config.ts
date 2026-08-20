import fs from "fs";
import chalk from "chalk";

interface ConfigFile {
  prefix: string;
}

const configFilePath = "./config.json";

if (!fs.existsSync(configFilePath)) {
  fs.writeFileSync(configFilePath, JSON.stringify({ prefix: "." }, null, 2));
}

const config: ConfigFile = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));

global.prefix = config.prefix || ".";

global.owner = [
  ["526631079388", "Owner", true],
  ["34610990280", "Colaborador"],
  ["584242773183", "Colaborador"],
];

global.allowedPrefixes = [
  ".", "!", "#", "?", "-", "+", "*", "~", "$", "&", "%", "=", "🔥", "💀", "✅", "🥰",
  "💎", "🐱", "🐶", "🌟", "🎃", "🌸", "🪼", "🍑", "🛠️", "📌", "⚡", "🚀", "👀", "💡", "💣", "💯", "😎", "☠️", "👾",
];

global.isOwner = (user: string): boolean => {
  const cleaned = user.replace(/[^0-9]/g, "");
  return global.owner.some((entry) => entry[0] === cleaned);
};

global.setPrefix = (newPrefix: string): void => {
  if (global.allowedPrefixes.includes(newPrefix)) {
    global.prefix = newPrefix;
    config.prefix = newPrefix;
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
    console.log(chalk.green(`✅ Prefijo cambiado a: ${chalk.yellow.bold(newPrefix)}`));
  } else {
    console.log(chalk.red(`❌ Prefijo no permitido. Usa uno de estos: ${chalk.blue.bold(global.allowedPrefixes.join(" "))}`));
  }
};

export const isOwner = global.isOwner;
export const setPrefix = global.setPrefix;
export const allowedPrefixes = global.allowedPrefixes;
