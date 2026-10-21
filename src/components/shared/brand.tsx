import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label={`${site.name} home`}>
      {site.logo.src ? (
        <Image src={site.logo.src} alt={site.logo.alt} width={42} height={42} />
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
      <span>
        {site.shortName}
        <small>SERVICES</small>
      </span>
    </Link>
  );
}
