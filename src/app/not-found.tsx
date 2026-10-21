import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div className="container not-found">
      <span className="eyebrow">PAGE NOT FOUND</span>
      <h1>Let’s find your way home.</h1>
      <p>
        The page you’re looking for may have moved. Explore our services or return to the homepage.
      </p>
      <div className="hero-actions">
        <Button asChild>
          <Link href="/">Return home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/services">Explore services</Link>
        </Button>
      </div>
    </div>
  );
}
