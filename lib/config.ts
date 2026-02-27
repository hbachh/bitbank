// lib/config.ts
import { join, fromFileUrl } from "$std/path/mod.ts";

const configPath = join(fromFileUrl(new URL("../env.json", import.meta.url)));

let configData: Record<string, any> = {};

try {
  const bytes = Deno.readFileSync(configPath);
  let jsonContent = new TextDecoder().decode(bytes).trim();
  
  // Strip potential BOM
  if (jsonContent.charCodeAt(0) === 0xFEFF) {
    jsonContent = jsonContent.slice(1);
  }
  
  configData = JSON.parse(jsonContent);
} catch (error) {
  console.error(`Failed to load env.json at ${configPath}:`, error.message);
  // Fallback to empty config if file is missing
}

export const config = {
  get(key: string): string | undefined {
    return configData[key];
  }
};

export default config;
