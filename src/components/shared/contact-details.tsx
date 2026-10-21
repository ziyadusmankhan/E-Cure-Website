import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { site } from "@/config/site";
export function ContactDetails() {
  return (
    <div className="contact-details">
      <div>
        <Phone size={20} aria-hidden="true" />
        <div>
          <h3>Call us</h3>
          {site.contact.phone ? (
            <a href={`tel:${site.contact.phone}`}>{site.contact.phone}</a>
          ) : (
            <p>Phone number to be confirmed</p>
          )}
        </div>
      </div>
      <div>
        <Mail size={20} aria-hidden="true" />
        <div>
          <h3>Email</h3>
          {site.contact.email ? (
            <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
          ) : (
            <p>Email address to be confirmed</p>
          )}
        </div>
      </div>
      <div>
        <MapPin size={20} aria-hidden="true" />
        <div>
          <h3>Areas we serve</h3>
          <p>{site.contact.serviceArea || "Service locations to be confirmed"}</p>
          {site.contact.address && <p>{site.contact.address}</p>}
          {site.contact.mapUrl && (
            <a href={site.contact.mapUrl} target="_blank" rel="noreferrer">
              View location on map
            </a>
          )}
        </div>
      </div>
      <div>
        <MessageCircle size={20} aria-hidden="true" />
        <div>
          <h3>WhatsApp</h3>
          {site.contact.whatsappUrl ? (
            <a href={site.contact.whatsappUrl} target="_blank" rel="noreferrer">
              Start a conversation
            </a>
          ) : (
            <p>Available once contact details are confirmed</p>
          )}
        </div>
      </div>
    </div>
  );
}
