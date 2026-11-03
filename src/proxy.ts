import { NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  // Always replace a supplied value; only this server determines the route.
  headers.set("x-healthcare-admin-path", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: "/admin/:path*" };
