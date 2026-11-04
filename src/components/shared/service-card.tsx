import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Service } from "@/types/service";
import { ServiceIcon } from "./service-icon";
export function ServiceCard({ service, index = 0, compact = false }: { service: Service; index?: number; compact?: boolean }) {
  return (
    <Link href={`/services/${service.slug}`} className={`service-card${compact ? " service-card--compact" : ""}`}>
      <div className="service-card-top">
        <span className="service-icon">
          <ServiceIcon slug={service.slug} />
        </span>
        <span className="card-number">0{index + 1}</span>
      </div>
      <h3>{service.title}</h3>
      <p>{service.description}</p>
      <span className="card-link">
        {compact ? <ArrowRight size={17} aria-hidden="true" /> : <>Explore service <ArrowUpRight size={18} aria-hidden="true" /></>}
      </span>
    </Link>
  );
}
