import {
  Video,
  Activity,
  HandHeart,
  Accessibility,
  FlaskConical,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { getService } from "@/data/services";
const icons: Record<string, LucideIcon> = {
  "online-consultation": Video,
  physiotherapy: Activity,
  "caretaker-services": HandHeart,
  "medical-equipment": Accessibility,
  "laboratory-services": FlaskConical,
  "nursing-care": Stethoscope,
};
export function ServiceIcon({ slug, size = 28 }: { slug: string; size?: number }) {
  const Icon = icons[getService(slug)?.icon || slug] || HandHeart;
  return <Icon size={size} strokeWidth={1.5} aria-hidden="true" />;
}
