import "server-only";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { and, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../db/connection";
import type { AdminIdentity } from "@/types/admin-auth";
import { mediaAssets } from "../db/schema";
import { BackendError, operation } from "../errors";
import { guardActor, adminAudit } from "../admin/guard";
export async function prepareImage(bytes: Buffer, logo = false) {
  if (!bytes.length || bytes.length > 2 * 1024 * 1024) throw new BackendError("PAYLOAD_TOO_LARGE");
  try {
    const image = sharp(bytes, { limitInputPixels: 16000000, failOn: "warning", animated: false });
    const meta = await image.metadata();
    if (
      !["jpeg", "png", "webp"].includes(meta.format || "") ||
      (meta.pages || 1) !== 1 ||
      !meta.width ||
      !meta.height ||
      meta.width > 4096 ||
      meta.height > 4096
    )
      throw new Error("Invalid raster");
    const { data, info } = await image
      .rotate()
      .resize({
        width: logo ? 512 : 1600,
        height: logo ? 512 : 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    if (data.length > 1500000) throw new BackendError("PAYLOAD_TOO_LARGE");
    return {
      data: data.toString("base64"),
      width: info.width,
      height: info.height,
      digest: createHash("sha256").update(data).digest("hex"),
    };
  } catch (error) {
    if (error instanceof BackendError) throw error;
    throw new BackendError("INVALID_IMAGE");
  }
}
export async function uploadMedia(db: Database, actor: AdminIdentity, bytes: Buffer, logo = false) {
  const prepared = await prepareImage(bytes, logo);
  return operation(() =>
    db.transaction(async (tx) => {
      await guardActor(tx, actor, "content:manage");
      const [row] = await tx.insert(mediaAssets).values(prepared).returning({ id: mediaAssets.id });
      await adminAudit(tx, actor, "created", "media", row.id);
      return { path: `/api/media/${row.id}` };
    }),
  );
}
export async function readMedia(db: Database, id: string, actor?: AdminIdentity) {
  z.uuid().parse(id);
  return operation(() =>
    db.transaction(async (tx) => {
      if (actor) await guardActor(tx, actor, "content:manage");
      const [row] = await tx
        .select()
        .from(mediaAssets)
        .where(and(eq(mediaAssets.id, id), actor ? undefined : isNotNull(mediaAssets.publishedAt)));
      if (!row) throw new BackendError("NOT_FOUND");
      return row;
    }),
  );
}
