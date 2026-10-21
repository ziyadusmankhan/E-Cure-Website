import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Service } from "@/types/service";
import { ServiceIcon } from "./service-icon";
export function ServiceCard({ service, index = 0 }: { service: Service; index?: number }) {
  return (
    <Link href={`/services/${service.slug}`} className="service-card">
      <div className="service-card-top">
        <span className="service-icon">
          <ServiceIcon slug={service.slug} />
        </span>
        <span className="card-number">0{index + 1}</span>
      </div>
      <h3>{service.title}</h3>
      <p>{service.description}</p>
      <span className="card-link">
        Explore service <ArrowUpRight size={18} aria-hidden="true" />
      </span>
    </Link>
  );
}
