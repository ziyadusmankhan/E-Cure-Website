import type { NextRequest } from "next/server";
import { handleAdminRead } from "@/server/auth/http";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  return handleAdminRead(request, "workspace:read");
}
