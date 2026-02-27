// lib/config.ts

/**
 * Configuration utility that reads from Deno.env
 * This allows all secrets to be managed via Deno Deploy environment variables
 * or a local .env file when running with --env
 */
export const config = {
  get(key: string): string | undefined {
    return Deno.env.get(key);
  }
};

export default config;
