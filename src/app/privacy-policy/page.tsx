import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
export const metadata: Metadata = {
  title: "Provisional privacy policy",
  description:
    "How this demonstration handles form entries and what must be reviewed before a production launch.",
};
export default function PrivacyPage() {
  return (
    <div className="container legal-page">
      <Breadcrumbs items={[{ label: "Privacy policy" }]} />
      <span className="eyebrow">PROVISIONAL · DEMONSTRATION ONLY</span>
      <h1>
        Your information
        <br />
        and this demo.
      </h1>
      <p className="lead">
        This is a demonstration notice, not a final privacy policy. The operating company must
        provide and review its legal and privacy content before a production launch.
      </p>
      <section>
        <h2>What happens to form entries</h2>
        <p>
          The appointment and inquiry forms run in your browser. Entries are used only to display
          the form and review state. The demo does not send these entries to a booking service,
          store them in a database, or save them to localStorage. Entries are cleared when you
          complete the demo or leave the form.
        </p>
      </section>
      <section>
        <h2>Use example details</h2>
        <p>
          Please use fictional contact details when exploring this demonstration. Do not enter
          medical histories, identification documents, test results, or other sensitive health
          information.
        </p>
      </section>
      <section>
        <h2>Website delivery</h2>
        <p>
          Serving a website involves ordinary technical requests to the hosting service. Hosting
          infrastructure may process technical information such as IP addresses and request logs.
          This project has no added analytics, advertising trackers, payment processing, or
          authentication. Production hosting and any future integrations need a separate privacy
          review.
        </p>
      </section>
      <section>
        <h2>Before a real service launches</h2>
        <p>
          The final policy must identify the responsible organisation, the information collected,
          its purposes and handling, retention periods, service providers, contact details, and any
          applicable rights and requirements. This demonstration makes no legal compliance claims.
        </p>
      </section>
      <section>
        <h2>Privacy contact</h2>
        <p>
          The responsible company and its privacy contact details are to be confirmed. Do not use
          this demonstration to request care or transmit private information.
        </p>
      </section>
    </div>
  );
}
