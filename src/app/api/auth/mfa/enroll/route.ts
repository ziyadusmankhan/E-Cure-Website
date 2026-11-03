import type { NextRequest } from "next/server";
import { handleAuth } from "@/server/auth/http";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  return handleAuth(request, "enroll");
}
