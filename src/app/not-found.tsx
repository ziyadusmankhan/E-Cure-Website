import { site } from "@/config/site";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div className="container not-found">
      <span className="eyebrow">{site.copy.not_found_page_not_found_1}</span>
      <h1>{site.copy.not_found_lets_find_your_way_home_2}</h1>
      <p>{site.copy.not_found_the_page_youre_looking_for_3}</p>
      <div className="hero-actions">
        <Button asChild>
          <Link href="/">{site.copy.not_found_return_home_4}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/services">{site.copy.not_found_explore_services_5}</Link>
        </Button>
      </div>
    </div>
  );
}
