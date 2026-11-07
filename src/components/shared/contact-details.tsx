"use client";
import { useWebsite } from "@/components/website-provider";
import { contactPhones } from "@/config/profile-utils";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
export function ContactDetails() {
  const { site } = useWebsite();
  const phones = contactPhones(site.contact);
  return (
    <div className="contact-details">
      <div>
        <Phone size={20} aria-hidden="true" />
        <div>
          <h3>{site.copy.shared_contact_details_call_us_1}</h3>
          {phones.length ? (
            <div className="contact-phone-links">
              {phones.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
            </div>
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
          <h3>{site.presentation === "ecure" ? "Location" : site.copy.shared_contact_details_areas_we_serve_5}</h3>
          {(!site.contact.address || site.presentation !== "ecure") && (
            <p>{site.contact.serviceArea || "Service locations to be confirmed"}</p>
          )}
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
