import { handleSubmission } from "@/server/submissions/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return handleSubmission(request, "inquiry");
}
