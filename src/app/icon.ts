import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@/config/site";
import { ecureAssets } from "@/config/branding";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const asset = site.presentation === "ecure" ? ecureAssets.icon : "/images/platform-icon.png";
  const bytes = await readFile(join(process.cwd(), "public", asset));
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": contentType } });
}
