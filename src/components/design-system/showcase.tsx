"use client";
import { useState } from "react";
import { themePresets, type ThemeName } from "@/config/themes";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { StatusBadge, requestStatuses, type RequestStatus } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { AccessibleDialog } from "@/components/ui/dialog";
import { AdminShell } from "@/components/admin/admin-shell";
import { FAQ } from "@/components/ui/accordion";
import { ServiceCard } from "@/components/shared/service-card";
import { services } from "@/data/services";
type SampleRow = { id: string; contact: string; service: string; status: RequestStatus };
const rows: SampleRow[] = [
  { id: "DEMO-001", contact: "Example contact A", service: "Physiotherapy", status: "New" },
  { id: "DEMO-002", contact: "Example contact B", service: "Nursing care", status: "Contacted" },
];
export function Showcase() {
  const [theme, setTheme] = useState<ThemeName>("clinical-blue");
  const [error, setError] = useState("");
  return (
    <div className="design-system" data-theme={theme}>
      <div className="container section">
        <span className="eyebrow">PHASE 2 · COMPONENT REVIEW</span>
        <h1>
          Considered care.
          <br />A consistent design language.
        </h1>
        <p className="design-intro">
          Review shared components, responsive layouts and controlled themes. All records below are
          fictional interface examples.
        </p>
        <div className="field theme-selector">
          <label htmlFor="theme-preset">Theme preset</label>
          <select
            id="theme-preset"
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeName)}
          >
            {Object.entries(themePresets).map(([key, value]) => (
              <option value={key} key={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>
        <section className="design-section" id="actions">
          <h2>Clear actions</h2>
          <div className="design-actions">
            <Button>Primary action</Button>
            <Button variant="outline">Secondary action</Button>
            <Button variant="text">Text action</Button>
            <Button disabled>Disabled action</Button>
            <AccessibleDialog
              theme={theme}
              title="Review example"
              description="An accessible dialog with managed focus and Escape support."
              trigger={<Button variant="outline">Open review dialog</Button>}
            >
              <p className="design-intro">This is a component example. No information is sent.</p>
            </AccessibleDialog>
          </div>
        </section>
        <section className="design-section">
          <h2>Helpful forms</h2>
          <form
            className="design-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const value = new FormData(e.currentTarget).get("example-name")?.toString().trim();
              setError(value ? "" : "Enter an example name.");
            }}
          >
            <Field
              id="example-name"
              label="Example name"
              hint="Use fictional details only."
              error={error}
            >
              <input
                id="example-name"
                name="example-name"
                aria-invalid={!!error}
                aria-describedby={`example-name-hint${error ? " example-name-error" : ""}`}
              />
            </Field>
            <Button type="submit">Check example field</Button>
          </form>
        </section>
        <section className="design-section">
          <h2>Flexible service cards</h2>
          <div className="services-grid">
            {services.slice(0, 3).map((s, i) => (
              <ServiceCard service={s} index={i} key={s.slug} />
            ))}
          </div>
        </section>
        <section className="design-section">
          <h2>Questions with clear answers</h2>
          <FAQ
            items={[
              {
                question: "Is this a live administration area?",
                answer:
                  "No. These are reusable component examples with fictional records. Authentication and operational workflows belong to later phases.",
              },
            ]}
          />
        </section>
        <section className="design-section" id="workspace">
          <h2>Calm operational components</h2>
          <AdminShell
            theme={theme}
            title="Request queue example"
            navigation={[
              { label: "Actions", href: "#actions" },
              { label: "Request queue", href: "#queue" },
            ]}
          >
            <div className="design-statuses">
              {requestStatuses.map((status) => (
                <StatusBadge status={status} key={status} />
              ))}
            </div>
            <div id="queue">
              <DataTable
                caption="Example request queue"
                rows={rows}
                rowKey={(row) => row.id}
                columns={[
                  { key: "id", label: "Reference", render: (row) => row.id },
                  { key: "contact", label: "Contact", render: (row) => row.contact },
                  { key: "service", label: "Service", render: (row) => row.service },
                  {
                    key: "status",
                    label: "Status",
                    render: (row) => <StatusBadge status={row.status} />,
                  },
                ]}
              />
            </div>
          </AdminShell>
        </section>
      </div>
    </div>
  );
}
