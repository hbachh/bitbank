import { jwtVerify, SignJWT } from "npm:jose";
import config from "@/lib/config.ts";

const SECRET_KEY = new TextEncoder().encode(
  config.get("JWT_SECRET") || "aiyoungguru-secret-key-2024",
);

export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch (error) {
    return null;
  }
}
