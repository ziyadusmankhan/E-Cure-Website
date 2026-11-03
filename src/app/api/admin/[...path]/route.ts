import { NextRequest } from "next/server";
import { handleManagement } from "@/server/admin/http";
export const runtime = "nodejs";
async function handle(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleManagement(request, (await params).path);
}
export { handle as GET, handle as POST, handle as PATCH };
