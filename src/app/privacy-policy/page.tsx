import { pageMetadata } from "@/config/metadata";
import { site } from "@/config/site";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
export const metadata: Metadata = pageMetadata("privacy");
export default function PrivacyPage() {
  return (
    <div className="container legal-page">
      <Breadcrumbs items={[{ label: "Privacy policy" }]} />
      <span className="eyebrow">{site.copy.privacy_policy_provisional_demonstration_only_1}</span>
      <h1>
        {site.copy.privacy_policy_your_information_2}
        <br />
        {site.copy.privacy_policy_and_this_demo_3}
      </h1>
      <p className="lead">{site.copy.privacy_policy_this_is_a_demonstration_notice_4}</p>
      <section>
        <h2>{site.copy.privacy_policy_what_happens_to_form_entries_5}</h2>
        <p>{site.copy.privacy_policy_the_appointment_and_inquiry_forms_6}</p>
      </section>
      <section>
        <h2>{site.copy.privacy_policy_use_example_details_7}</h2>
        <p>{site.copy.privacy_policy_please_use_fictional_contact_details_8}</p>
      </section>
      <section>
        <h2>{site.copy.privacy_policy_website_delivery_9}</h2>
        <p>{site.copy.privacy_policy_serving_a_website_involves_ordinary_10}</p>
      </section>
      <section>
        <h2>{site.copy.privacy_policy_before_a_real_service_launches_11}</h2>
        <p>{site.copy.privacy_policy_the_final_policy_must_identify_12}</p>
      </section>
      <section>
        <h2>{site.copy.privacy_policy_privacy_contact_13}</h2>
        <p>{site.copy.privacy_policy_the_responsible_company_and_its_14}</p>
      </section>
    </div>
  );
}
