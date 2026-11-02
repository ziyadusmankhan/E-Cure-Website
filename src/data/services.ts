import { site } from "@/config/site";
import { activeServices } from "@/config/profile-utils";
export const services = activeServices(site);
export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}
