import Link from "next/link";
import { ArrowUpRight, HousePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
export function CTASection({ service }: { service?: string }) {
  return (
    <section className="cta-section">
      <div className="container cta-inner">
        <div>
          <span className="eyebrow">LET’S FIND YOUR NEXT STEP</span>
          <h2>Looking for care at home?</h2>
          <p>Explore the options and share what you’re looking for.</p>
        </div>
        <div className="cta-actions">
          <Button asChild variant="light">
            <Link href={service ? `/book-appointment?service=${service}` : "/book-appointment"}>
              Request an appointment <ArrowUpRight size={18} />
            </Link>
          </Button>
          <Link className="light-link" href="/services">
            Explore all services <ArrowUpRight size={17} />
          </Link>
        </div>
        <HousePlus className="cta-watermark" size={250} strokeWidth={0.5} aria-hidden="true" />
      </div>
    </section>
  );
}
