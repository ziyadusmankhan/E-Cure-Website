import { NextRequest, NextResponse } from "next/server";
import { readMedia } from "@/server/cms/media";
import { getDatabase } from "@/server/db/connection";
import { publicError } from "@/server/errors";
import { randomUUID } from "node:crypto";
export const runtime = "nodejs";
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const row = await readMedia(getDatabase(), (await params).id);
    return new NextResponse(Buffer.from(row.data, "base64"), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        ETag: `"${row.digest}"`,
      },
    });
  } catch (error) {
    const safe = publicError(error, randomUUID());
    return NextResponse.json(
      { error: safe.error },
      { status: safe.status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
