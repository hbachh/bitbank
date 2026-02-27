// lib/config.ts
import { join, fromFileUrl } from "$std/path/mod.ts";

const configPath = join(fromFileUrl(new URL("../env.json", import.meta.url)));

let configData: Record<string, any> = {};

try {
  const jsonContent = Deno.readTextFileSync(configPath);
  configData = JSON.parse(jsonContent);
} catch (error) {
  console.error("Failed to load env.json:", error.message);
  // Fallback to empty config if file is missing
}

export const config = {
  get(key: string): string | undefined {
    return configData[key];
  }
};

export default config;
