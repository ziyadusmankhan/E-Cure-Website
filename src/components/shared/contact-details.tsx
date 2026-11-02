import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { site } from "@/config/site";
export function ContactDetails() {
  return (
    <div className="contact-details">
      <div>
        <Phone size={20} aria-hidden="true" />
        <div>
          <h3>{site.copy.shared_contact_details_call_us_1}</h3>
          {site.contact.phone ? (
            <a href={`tel:${site.contact.phone}`}>{site.contact.phone}</a>
          ) : (
            <p>{site.copy.shared_contact_details_phone_number_to_be_confirmed_2}</p>
          )}
        </div>
      </div>
      <div>
        <Mail size={20} aria-hidden="true" />
        <div>
          <h3>{site.copy.shared_contact_details_email_3}</h3>
          {site.contact.email ? (
            <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
          ) : (
            <p>{site.copy.shared_contact_details_email_address_to_be_confirmed_4}</p>
          )}
        </div>
      </div>
      <div>
        <MapPin size={20} aria-hidden="true" />
        <div>
          <h3>{site.copy.shared_contact_details_areas_we_serve_5}</h3>
          <p>{site.contact.serviceArea || "Service locations to be confirmed"}</p>
          {site.contact.address && <p>{site.contact.address}</p>}
          {site.contact.mapUrl && (
            <a href={site.contact.mapUrl} target="_blank" rel="noreferrer">
              {site.copy.shared_contact_details_view_location_on_map_6}
            </a>
          )}
        </div>
      </div>
      {site.features.whatsapp && (
        <div>
          <MessageCircle size={20} aria-hidden="true" />
          <div>
            <h3>{site.copy.shared_contact_details_whatsapp_7}</h3>
            {site.contact.whatsappUrl ? (
              <a href={site.contact.whatsappUrl} target="_blank" rel="noreferrer">
                {site.copy.shared_contact_details_start_a_conversation_8}
              </a>
            ) : (
              <p>{site.copy.shared_contact_details_available_once_contact_details_are_9}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
