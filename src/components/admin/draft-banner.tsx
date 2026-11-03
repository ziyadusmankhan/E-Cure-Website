"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useWebsite } from "@/components/website-provider";
export function DraftBanner() {
  const { preview } = useWebsite();
  const pathname = usePathname();
  const [error, setError] = useState("");
  if (!preview || pathname.startsWith("/admin")) return null;
  return (
    <div className="cms-preview-banner" role="status">
      <strong>Draft preview — changes are not published.</strong>
      <Link href="/admin/website">Return to editor</Link>
      <button
        type="button"
        onClick={async () => {
          try {
            const r = await fetch("/api/admin/cms/preview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ enabled: false }),
            });
            if (!r.ok) throw Error();
            window.location.reload();
          } catch {
            setError("Could not leave preview. Please try again.");
          }
        }}
      >
        View published website
      </button>
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
