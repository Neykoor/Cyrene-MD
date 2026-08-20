import fs from "fs";
import path from "path";
import chalk from "chalk";

export type PluginRun = (
  sock: any,
  msg: any,
  args: string[],
  sender: string
) => Promise<void>;

interface PluginModule {
  commands?: string[];
  run?: PluginRun;
}

const pluginsDir = path.join(__dirname, "..", "plugins");
const commandMap = new Map<string, PluginRun>();

function findPluginFiles(dir: string): string[] {
  let results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results = results.concat(findPluginFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|js)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

export function loadPlugins(): void {
  commandMap.clear();

  const files = findPluginFiles(pluginsDir);

  console.log(chalk.cyan(`📦 Cargando plugins desde ${pluginsDir}...`));

  for (const file of files) {
    try {
      delete require.cache[require.resolve(file)];
      const mod: PluginModule = require(file);

      if (Array.isArray(mod.commands) && typeof mod.run === "function") {
        for (const rawCommand of mod.commands) {
          commandMap.set(rawCommand.toLowerCase(), mod.run);
        }

        const relativePath = path.relative(pluginsDir, file);
        console.log(
          chalk.green(`  ✅ ${relativePath}`) +
            chalk.gray(` → [${mod.commands.join(", ")}]`)
        );
      }
    } catch (err) {
      console.error(chalk.red(`  ❌ Error cargando el plugin ${file}:`), err);
    }
  }

  console.log(chalk.cyan(`📦 ${commandMap.size} comando(s) registrados.`));
}

export function getCommandHandler(command: string): PluginRun | undefined {
  return commandMap.get(command.toLowerCase());
}
