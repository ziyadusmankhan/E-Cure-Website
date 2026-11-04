"use client";
import { useWebsite } from "@/components/website-provider";
import Image from "next/image";
import Link from "next/link";
import { brandArtwork, ecureLogo } from "@/config/branding";
export function Brand({ onNavigate }: { onNavigate?: () => void }) {
  const { site } = useWebsite();
  const { src, official } = brandArtwork(site);
  const fullLogo = official || (site.presentation === "ecure" && Boolean(src));
  const image = src && <Image
    src={src}
    unoptimized={src.startsWith("/api/admin/media/")}
    alt={site.logo.alt}
    width={official ? ecureLogo.width : fullLogo ? 220 : 42}
    height={official ? ecureLogo.height : fullLogo ? 120 : 42}
    sizes={fullLogo ? "(max-width: 600px) 180px, 240px" : "42px"}
  />;
  return (
    <Link href="/" onClick={onNavigate} className={`brand${fullLogo ? " brand-lockup" : ""}`} aria-label={`${site.name} home`}>
      {src ? (
        official ? <span className="brand-artwork" style={{
          aspectRatio: `${ecureLogo.frame.width} / ${ecureLogo.frame.height}`,
          "--logo-image-width": `${ecureLogo.width / ecureLogo.frame.width * 100}%`,
          "--logo-shift-x": `${-ecureLogo.frame.left / ecureLogo.width * 100}%`,
          "--logo-shift-y": `${-ecureLogo.frame.top / ecureLogo.height * 100}%`,
        } as React.CSSProperties}>{image}</span> : image
      ) : (
        <svg
          className="brand-mark"
          width="43"
          height="43"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7 22 24 7l17 15v18H7V22Z"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path d="M24 18v16M16 26h16" stroke="var(--green)" strokeWidth="4" />
          <path d="M10 40h28" stroke="var(--green)" strokeWidth="2.4" />
        </svg>
      )}
      {official && site.brandLine && <small className="brand-tagline">{site.brandLine}</small>}
      {!fullLogo && <span>
        {site.shortName}
        <small>{site.brandLine}</small>
      </span>}
    </Link>
  );
}
