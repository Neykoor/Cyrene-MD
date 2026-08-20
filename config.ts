import fs from "fs";
import chalk from "chalk";

interface ConfigMedia {
  menuCover: string;
  businessThumb: string;
}

interface ConfigFile {
  prefix: string;
  pinterestQueries: string[];
  media: ConfigMedia;
}

const configFilePath = "./config.json";

const defaultConfig: ConfigFile = {
  prefix: ".",
  pinterestQueries: ["cyrene honkai star rail icon", "Japonesas icon"],
  media: {
    menuCover: "src/media/menu-cover.jpg",
    businessThumb: "src/media/business-thumb.jpg",
  },
};

if (!fs.existsSync(configFilePath)) {
  fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));
}

const storedConfig: Partial<ConfigFile> = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));

const config: ConfigFile = {
  prefix: storedConfig.prefix || defaultConfig.prefix,
  pinterestQueries: storedConfig.pinterestQueries?.length
    ? storedConfig.pinterestQueries
    : defaultConfig.pinterestQueries,
  media: {
    menuCover: storedConfig.media?.menuCover || defaultConfig.media.menuCover,
    businessThumb: storedConfig.media?.businessThumb || defaultConfig.media.businessThumb,
  },
};

fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));

global.prefix = config.prefix;
global.pinterestQueries = config.pinterestQueries;
global.media = config.media;

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
export const pinterestQueries = global.pinterestQueries;
export const media = global.media;
