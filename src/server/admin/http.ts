import "server-only";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authRuntime, privateHeaders } from "../auth/http";
import { cookieName } from "../auth/config";
import { BackendError, publicError } from "../errors";
import { operationsStore } from "./operations";
import { cmsStore } from "../cms/store";
import { readMedia, uploadMedia } from "../cms/media";
import { takeRateLimit } from "../submissions/store";
import { csvCell } from "@/types/operations";
import type { AdminPermission } from "@/types/admin-auth";
export async function boundedBytes(request: Request, max: number) {
  if (request.headers.get("content-encoding")) throw new BackendError("UNSUPPORTED_MEDIA");
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > max))
    throw new BackendError("PAYLOAD_TOO_LARGE");
  const reader = request.body?.getReader();
  if (!reader) throw new BackendError("BAD_REQUEST");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new BackendError("PAYLOAD_TOO_LARGE");
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally {
    reader.releaseLock();
  }
}
export async function handleManagement(
  request: NextRequest,
  path: string[],
  deps: Parameters<typeof authRuntime>[0] = {},
) {
  const requestId = randomUUID();
  try {
    const [area, id, extra] = path;
    if (extra || !area) throw new BackendError("NOT_FOUND");
    const { policy, store, db } = authRuntime(deps);
    const permission: AdminPermission =
      area === "cms" || area === "media"
        ? "content:manage"
        : area === "appointments"
          ? id === "export"
            ? "exports:read"
            : "appointments:manage"
          : area === "customers"
            ? "customers:manage"
            : area === "inquiries"
              ? "inquiries:manage"
              : "workspace:read";
    const { principal } = await store.authorize(
      request.cookies.get(cookieName(policy))?.value,
      permission,
    );
    const json = (value: unknown) => NextResponse.json(value, { headers: privateHeaders });
    const ops = operationsStore(db, principal);
    const filters = Object.fromEntries(request.nextUrl.searchParams);
    if (request.method === "GET") {
      if (area === "overview" && !id) return json(await ops.dashboard());
      if (area === "appointments" && id === "export") {
        const result = await ops.listAppointments(filters, true);
        const rows = [
          ["Reference", "Name", "Phone", "Email", "Service", "Date", "Time", "Status"],
          ...result.items.map((r) => [
            r.reference,
            r.name,
            r.phone,
            r.email || "",
            r.service,
            r.date,
            r.time,
            r.status,
          ]),
        ];
        return new NextResponse(
          "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n"),
          {
            headers: {
              ...privateHeaders,
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition": "attachment; filename=appointments.csv",
              "X-Export-Limit": "1000",
            },
          },
        );
      }
      if (area === "appointments")
        return json(
          id
            ? await ops.appointment(id, Number(filters.history || 1))
            : await ops.listAppointments(filters),
        );
      if (area === "customers")
        return json(id ? await ops.customer(id) : await ops.listCustomers(filters));
      if (area === "inquiries")
        return json(
          id
            ? await ops.inquiry(id, Number(filters.history || 1))
            : await ops.listInquiries(filters),
        );
      if (area === "cms" && !id) return json(await cmsStore(db, principal).read());
      if (area === "media" && id) {
        const row = await readMedia(db, id, principal);
        return new NextResponse(Buffer.from(row.data, "base64"), {
          headers: { ...privateHeaders, "Content-Type": "image/webp" },
        });
      }
      throw new BackendError("NOT_FOUND");
    }
    if (request.method !== "POST" && request.method !== "PATCH")
      throw new BackendError("BAD_REQUEST");
    if (
      !policy.origins.includes(request.headers.get("origin") || "") ||
      request.headers.get("sec-fetch-site") === "cross-site" ||
      (policy.mode === "local" &&
        !["127.0.0.1", "localhost", "[::1]"].includes(request.nextUrl.hostname))
    )
      throw new BackendError("FORBIDDEN");
    await takeRateLimit(db, policy.encryptionKey, `management:${principal.userId}`, 120, 60000);
    if (area === "media" && !id) {
      await takeRateLimit(db, policy.encryptionKey, `media:${principal.userId}`, 10, 600000);
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(
          request.headers.get("content-type") || "",
        )
      )
        throw new BackendError("INVALID_IMAGE");
      return json(
        await uploadMedia(
          db,
          principal,
          await boundedBytes(request, 2 * 1024 * 1024),
          request.nextUrl.searchParams.get("kind") === "logo",
        ),
      );
    }
    if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
      throw new BackendError("UNSUPPORTED_MEDIA");
    let body: unknown;
    try {
      body = JSON.parse((await boundedBytes(request, 256 * 1024)).toString("utf8"));
    } catch (e) {
      if (e instanceof BackendError) throw e;
      throw new BackendError("BAD_REQUEST");
    }
    if (area === "appointments" && id) return json(await ops.changeAppointment(id, body));
    if (area === "customers" && id) return json(await ops.changeCustomer(id, body));
    if (area === "inquiries" && id) return json(await ops.changeInquiry(id, body));
    if (area === "cms" && id) {
      if (id === "preview") {
        const v = z.object({ enabled: z.boolean() }).strict().parse(body);
        const res = json({ next: "/" });
        res.cookies.set("healthcare-cms-preview", v.enabled ? "1" : "", {
          httpOnly: true,
          sameSite: "strict",
          secure: policy.secure,
          path: "/",
          maxAge: v.enabled ? 600 : 0,
        });
        return res;
      }
      const cms = cmsStore(db, principal);
      const handlers = {
        brand: cms.saveBrand,
        content: cms.saveContent,
        service: cms.saveService,
        archive: cms.archiveService,
        remove: cms.removeService,
        reorder: cms.reorder,
        discard: cms.discard,
        publish: cms.publish,
      };
      if (!Object.hasOwn(handlers, id)) throw new BackendError("NOT_FOUND");
      const res = json(await handlers[id as keyof typeof handlers](body));
      if (id === "publish")
        res.cookies.set("healthcare-cms-preview", "", {
          httpOnly: true,
          sameSite: "strict",
          secure: policy.secure,
          path: "/",
          maxAge: 0,
        });
      return res;
    }
    throw new BackendError("NOT_FOUND");
  } catch (error) {
    const safe = publicError(error, requestId);
    if (safe.status >= 500)
      console.error(
        JSON.stringify({ requestId, operation: "administration", code: safe.error.code }),
      );
    return NextResponse.json(
      { error: safe.error },
      { status: safe.status, headers: privateHeaders },
    );
  }
}
