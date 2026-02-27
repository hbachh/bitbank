import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { signToken, verifyToken } from "./jwt.ts";

export { signToken, verifyToken };

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
