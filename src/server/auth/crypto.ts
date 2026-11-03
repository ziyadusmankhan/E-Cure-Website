import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { BackendError } from "../errors";
export type ProviderTokens = { access_token: string; refresh_token: string; expires_at: number };
export const sessionHash = (value: string) => createHash("sha256").update(value).digest("hex");
export function seal(tokens: ProviderTokens, key: string, binding: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  cipher.setAAD(Buffer.from(`healthcare-admin-v1:${binding}`));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(tokens), "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}
export function unseal(value: string, key: string, binding: string): ProviderTokens {
  try {
    const [version, iv, tag, ciphertext, extra] = value.split(".");
    if (version !== "v1" || extra || !ciphertext || value.length > 20000) throw new Error();
    for (const part of [iv, tag, ciphertext]) {
      if (
        !/^[A-Za-z0-9_-]+$/.test(part) ||
        Buffer.from(part, "base64url").toString("base64url") !== part
      )
        throw new Error();
    }
    if (Buffer.from(iv, "base64url").length !== 12 || Buffer.from(tag, "base64url").length !== 16)
      throw new Error();
    const decipher = createDecipheriv(
      "aes-256-gcm",
      Buffer.from(key, "hex"),
      Buffer.from(iv, "base64url"),
    );
    decipher.setAAD(Buffer.from(`healthcare-admin-v1:${binding}`));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    const data = JSON.parse(
      Buffer.concat([
        decipher.update(Buffer.from(ciphertext, "base64url")),
        decipher.final(),
      ]).toString("utf8"),
    );
    if (
      typeof data.access_token !== "string" ||
      typeof data.refresh_token !== "string" ||
      !Number.isFinite(data.expires_at) ||
      !data.access_token ||
      !data.refresh_token
    )
      throw new Error();
    return data;
  } catch {
    throw new BackendError("UNAUTHENTICATED");
  }
}
