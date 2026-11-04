"use client";
import Image from "next/image";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  contentPages,
  copyKeysFor,
  type CmsDocument,
  type CmsEditorState,
  type ContentPage,
} from "@/types/cms";
import type { ServiceEntry } from "@/types/profile";
const label = (key: string) =>
  key
    .replace(/_\d+$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
const contentLabels: Record<string, string> = {
  home_0_34: "Benefit number prefix",
  home_0_39: "Process step number prefix",
};
function Field({
  title,
  value,
  onChange,
  long = false,
  required = true,
  maxLength,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  long?: boolean;
  required?: boolean;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id}>{title}</label>
      {long ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          maxLength={maxLength || 5000}
        />
      ) : (
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          maxLength={maxLength || 1000}
        />
      )}
    </div>
  );
}
function Rows<T extends Record<string, string>>({
  title,
  items,
  keys,
  onChange,
  blank,
}: {
  title: string;
  items: T[];
  keys: (keyof T & string)[];
  onChange: (v: T[]) => void;
  blank: T;
}) {
  return (
    <section className="admin-repeater">
      <h3>{title}</h3>
      {items.map((item, index) => (
        <div className="admin-repeat-row" key={index}>
          {keys.map((k) => (
            <Field
              key={k}
              title={`${label(k)} ${index + 1}`}
              value={item[k]}
              long
              onChange={(value) =>
                onChange(items.map((r, i) => (i === index ? { ...r, [k]: value } : r)))
              }
            />
          ))}
          <button
            type="button"
            className="admin-text-button"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            Remove {title.toLowerCase()} {index + 1}
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button button-secondary"
        onClick={() => onChange([...items, { ...blank }])}
      >
        Add {title.toLowerCase()}
      </button>
    </section>
  );
}
function Lines({
  title,
  items,
  onChange,
}: {
  title: string;
  items: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <label>
      {title} (one per line)
      <textarea
        value={items.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n"))}
        maxLength={15000}
      />
    </label>
  );
}
function Upload({
  title,
  path,
  onChange,
  logo = false,
}: {
  title: string;
  path: string;
  onChange: (v: string) => void;
  logo?: boolean;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="admin-image-field">
      <label>
        {title}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setError("");
            try {
              if (file.size > 2 * 1024 * 1024)
                throw new Error("Choose an image smaller than 2 MB.");
              const res = await fetch(`/api/admin/media${logo ? "?kind=logo" : ""}`, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
              });
              const v = await res.json();
              if (!res.ok) throw new Error(v.error?.message || "Unable to upload.");
              onChange(v.path);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Unable to upload.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      <p className="muted">JPEG, PNG or WebP, up to 2 MB. Use public website images only.</p>
      {path && (
        <Image
          unoptimized
          src={path.replace("/api/media/", "/api/admin/media/")}
          alt={`${title} preview`}
          width={160}
          height={100}
        />
      )}
      <p role="status">{busy ? "Preparing image…" : error}</p>
    </div>
  );
}
export function CmsEditor({ initial }: { initial: CmsEditorState }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [doc, setDoc] = useState<CmsDocument>(initial.draft);
  const [tab, setTab] = useState("branding");
  const [page, setPage] = useState<ContentPage>("home");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [unsaved, setUnsaved] = useState(false);
  const [original, setOriginal] = useState<string | null>(null);
  const [service, setService] = useState<ServiceEntry | null>(null);
  function edit(next: CmsDocument) {
    setDoc(next);
    setUnsaved(true);
  }
  function brand<K extends keyof CmsDocument["brand"]>(key: K, value: CmsDocument["brand"][K]) {
    edit({ ...doc, brand: { ...doc.brand, [key]: value } });
  }
  async function action(name: string, body: Record<string, unknown> = {}, preview = false) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/cms/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(name === "preview" ? body : { revision: state.revision, ...body }),
      });
      const v = await res.json();
      if (!res.ok) throw new Error(v.error?.message || "Unable to save.");
      if (name === "preview") {
        router.push("/");
        router.refresh();
        return;
      }
      setState(v);
      setDoc(v.draft);
      setUnsaved(false);
      setService(null);
      setMessage(
        name === "publish"
          ? "Published. Your public website is updated."
          : name === "discard"
            ? "Draft changes discarded."
            : "Draft saved. Publish when ready.",
      );
      if (preview) router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  const sorted = [...doc.services].sort((a, b) => a.order - b.order);
  function newService() {
    setOriginal(null);
    setService({
      ...structuredClone(
        sorted[0] || {
          image: doc.media.hero.src,
          imageAlt: doc.media.hero.alt,
          includes: [],
          audience: [],
          expectation: "",
          preparation: [],
          faqs: [],
        },
      ),
      slug: "",
      title: "",
      shortTitle: "",
      label: "",
      headline: "",
      description: "",
      overview: "",
      related: [],
      enabled: false,
      order: Math.min(10000, Math.max(-1, ...doc.services.map((item) => item.order)) + 1),
    });
    setUnsaved(true);
  }
  return (
    <>
      <span className="eyebrow">OWNER WORKSPACE</span>
      <h1>Website editor</h1>
      <p>Edit, save a draft, preview, then publish when ready.</p>
      <div className="admin-publication admin-card">
        <p>
          <strong>
            {state.revision === state.publishedRevision
              ? "Published version is current"
              : "Unpublished draft changes"}
          </strong>
          {unsaved ? " · You have unsaved edits." : ""}
        </p>
        <p className="muted">
          {state.publishedAt
            ? `Last published ${state.publishedAt.replace("T", " ").replace(".000Z", " UTC")}`
            : "The original website is live."}
        </p>
        <div className="admin-actions">
          <button
            className="button button-secondary"
            disabled={busy || unsaved}
            onClick={() => void action("preview", { enabled: true })}
          >
            Preview saved draft
          </button>
          <button
            className="button button-primary"
            disabled={busy || unsaved || state.revision === state.publishedRevision}
            onClick={() => {
              if (window.confirm("Publish this saved draft to the public website?"))
                void action("publish", {}, true);
            }}
          >
            Publish website
          </button>
          <button
            className="admin-text-button"
            disabled={busy}
            onClick={() => {
              if (window.confirm("Discard all unpublished changes and restore the live website?"))
                void action("discard");
            }}
          >
            Discard draft
          </button>
        </div>
        <p role="status" aria-live="polite">
          {message}
        </p>
        <button className="admin-text-button" onClick={() => window.location.reload()}>
          Reload latest saved draft
        </button>
      </div>
      <nav className="admin-editor-tabs" aria-label="Website editor sections">
        {["branding", "content", "services"].map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tab === t}
            onClick={() => {
              if (!unsaved || window.confirm("Leave unsaved edits?")) {
                setDoc(state.draft);
                setService(null);
                setUnsaved(false);
                setTab(t);
              }
            }}
          >
            {label(t)}
          </button>
        ))}
      </nav>
      {tab === "branding" && (
        <form
          className="admin-card"
          onSubmit={(e) => {
            e.preventDefault();
            void action("brand", { brand: doc.brand });
          }}
        >
          <fieldset disabled={busy}>
            <h2>Brand and business settings</h2>
            {(["name", "shortName", "brandLine", "tagline", "description"] as const).map((key) => (
              <Field
                key={key}
                title={label(key.replace(/([A-Z])/g, " $1"))}
                maxLength={
                  { name: 160, shortName: 80, brandLine: 100, tagline: 300, description: 1000 }[key]
                }
                value={doc.brand[key]}
                long={key === "description"}
                onChange={(v) => brand(key, v)}
              />
            ))}
            <Upload
              title="Logo"
              logo
              path={doc.brand.logo.src}
              onChange={(v) => brand("logo", { ...doc.brand.logo, src: v })}
            />
            <Field
              title="Logo description"
              value={doc.brand.logo.alt}
              onChange={(v) => brand("logo", { ...doc.brand.logo, alt: v })}
            />
            <button
              type="button"
              className="admin-text-button"
              onClick={() => brand("logo", { ...doc.brand.logo, src: "" })}
            >
              Use text logo
            </button>
            <label>
              Theme
              <select
                aria-label="Theme"
                value={doc.brand.theme}
                onChange={(e) => brand("theme", e.target.value as typeof doc.brand.theme)}
              >
                <option value="clinical-blue">Clinical blue</option>
                <option value="soft-teal">Soft teal</option>
                <option value="warm-neutral">Warm neutral</option>
              </select>
            </label>
            <Field
              title="Primary color (optional, #RRGGBB)"
              value={doc.brand.primaryColor}
              required={false}
              onChange={(v) => brand("primaryColor", v)}
            />
            <Field
              title="Secondary color (optional, #RRGGBB)"
              value={doc.brand.secondaryColor}
              required={false}
              onChange={(v) => brand("secondaryColor", v)}
            />
            <p className="muted">
              Leave colors blank for the theme defaults. Custom colors must provide readable
              contrast.
            </p>
            <Field
              title="Business timezone"
              value={doc.brand.timezone}
              onChange={(v) => brand("timezone", v)}
            />
            <h3>Contact information</h3>
            {Object.entries(doc.brand.contact).map(([k, v]) => (
              <Field
                key={k}
                title={label(k.replace(/([A-Z])/g, " $1"))}
                value={v}
                required={false}
                onChange={(value) => brand("contact", { ...doc.brand.contact, [k]: value })}
              />
            ))}
            <Rows
              title="Social link"
              items={doc.brand.socialLinks}
              keys={["label", "url"]}
              blank={{ label: "", url: "" }}
              onChange={(v) => brand("socialLinks", v)}
            />
            <button className="button button-primary">Save branding draft</button>
          </fieldset>
        </form>
      )}
      {tab === "content" && (
        <form
          className="admin-card"
          onSubmit={(e) => {
            e.preventDefault();
            const copy = Object.fromEntries(
              copyKeysFor(page, doc.copy).map((k) => [k, doc.copy[k]]),
            );
            void action("content", {
              page,
              copy,
              ...(["home", "about"].includes(page) ? { media: doc.media } : {}),
              ...(page === "home"
                ? { sections: doc.sections, benefits: doc.benefits, steps: doc.steps }
                : {}),
              ...(page === "faq" ? { faqGroups: doc.faqGroups } : {}),
            });
          }}
        >
          <fieldset disabled={busy}>
            <label>
              Page
              <select
                aria-label="Page"
                value={page}
                onChange={(e) => {
                  if (!unsaved || window.confirm("Leave unsaved edits?")) {
                    setDoc(state.draft);
                    setUnsaved(false);
                    setPage(e.target.value as ContentPage);
                  }
                }}
              >
                {contentPages.map((p) => (
                  <option key={p} value={p}>
                    {label(p)}
                  </option>
                ))}
              </select>
            </label>
            <h2>{label(page)} content</h2>
            {copyKeysFor(page, doc.copy).map((key) => (
              <Field
                key={key}
                title={contentLabels[key] || label(
                  key.replace(
                    /^(home|about|services|service|contact|faq|book_appointment|shared|layout)_/,
                    "",
                  ),
                )}
                value={doc.copy[key]}
                long
                onChange={(v) => edit({ ...doc, copy: { ...doc.copy, [key]: v } })}
              />
            ))}
            {["home", "about"].includes(page) && (
              <>
                <Upload
                  title={page === "home" ? "Home hero image" : "About image"}
                  path={doc.media[page === "home" ? "hero" : "about"].src}
                  onChange={(v) => {
                    const k = page === "home" ? "hero" : "about";
                    edit({ ...doc, media: { ...doc.media, [k]: { ...doc.media[k], src: v } } });
                  }}
                />
                <Field
                  title="Image description"
                  value={doc.media[page === "home" ? "hero" : "about"].alt}
                  onChange={(v) => {
                    const k = page === "home" ? "hero" : "about";
                    edit({ ...doc, media: { ...doc.media, [k]: { ...doc.media[k], alt: v } } });
                  }}
                />
              </>
            )}
            {page === "home" && (
              <>
                <h3>Visible sections</h3>
                {Object.entries(doc.sections).map(([k, v]) => (
                  <label key={k} className="admin-checkbox">
                    <input
                      type="checkbox"
                      checked={v}
                      onChange={(e) =>
                        edit({ ...doc, sections: { ...doc.sections, [k]: e.target.checked } })
                      }
                    />
                    {label(k)}
                  </label>
                ))}
                <Rows
                  title="Benefit"
                  items={doc.benefits}
                  keys={["title", "text"]}
                  blank={{ title: "", text: "" }}
                  onChange={(v) => edit({ ...doc, benefits: v })}
                />
                <Rows
                  title="Step"
                  items={doc.steps}
                  keys={["title", "text"]}
                  blank={{ title: "", text: "" }}
                  onChange={(v) => edit({ ...doc, steps: v })}
                />
              </>
            )}
            {page === "faq" && (
              <section>
                <h3>FAQ groups</h3>
                {doc.faqGroups.map((g, index) => (
                  <div className="admin-repeat-row" key={index}>
                    <Field
                      title="Group name"
                      value={g.title}
                      onChange={(v) =>
                        edit({
                          ...doc,
                          faqGroups: doc.faqGroups.map((r, i) =>
                            i === index ? { ...r, title: v } : r,
                          ),
                        })
                      }
                    />
                    <Field
                      title="Group description"
                      value={g.description}
                      onChange={(v) =>
                        edit({
                          ...doc,
                          faqGroups: doc.faqGroups.map((r, i) =>
                            i === index ? { ...r, description: v } : r,
                          ),
                        })
                      }
                    />
                    <Rows
                      title="Question"
                      items={g.items}
                      keys={["question", "answer"]}
                      blank={{ question: "", answer: "" }}
                      onChange={(v) =>
                        edit({
                          ...doc,
                          faqGroups: doc.faqGroups.map((r, i) =>
                            i === index ? { ...r, items: v } : r,
                          ),
                        })
                      }
                    />
                    <button
                      type="button"
                      className="admin-text-button"
                      onClick={() =>
                        edit({ ...doc, faqGroups: doc.faqGroups.filter((_, i) => i !== index) })
                      }
                    >
                      Remove group
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() =>
                    edit({
                      ...doc,
                      faqGroups: [
                        ...doc.faqGroups,
                        {
                          id: `questions-${crypto.randomUUID().slice(0, 8)}`,
                          title: "",
                          description: "",
                          items: [{ question: "", answer: "" }],
                        },
                      ],
                    })
                  }
                >
                  Add FAQ group
                </button>
              </section>
            )}
            <button className="button button-primary">Save content draft</button>
          </fieldset>
        </form>
      )}
      {tab === "services" && (
        <section className="admin-card">
          <h2>Services</h2>
          <button className="button button-primary" disabled={busy} onClick={newService}>
            Add service
          </button>
          <ul className="admin-service-list">
            {sorted.map((s, index) => (
              <li key={s.slug}>
                <strong>{s.title}</strong>
                <span>{s.enabled ? "Enabled" : "Disabled"}</span>
                <div className="admin-actions">
                  <button
                    className="admin-text-button"
                    disabled={busy}
                    onClick={() => {
                      setOriginal(s.slug);
                      setService(structuredClone(s));
                      setUnsaved(false);
                    }}
                  >
                    Edit {s.shortTitle}
                  </button>
                  <button
                    className="admin-text-button"
                    disabled={busy || index === 0 || unsaved}
                    onClick={() => {
                      const ids = sorted.map((x) => x.slug);
                      [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
                      void action("reorder", { slugs: ids });
                    }}
                  >
                    Move up {s.shortTitle}
                  </button>
                  <button
                    className="admin-text-button"
                    disabled={busy || unsaved}
                    onClick={() => void action("archive", { slug: s.slug })}
                  >
                    Disable {s.shortTitle}
                  </button>
                  <button
                    className="admin-text-button"
                    disabled={busy || unsaved}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Remove ${s.title} from the draft? Existing appointments are preserved.`,
                        )
                      )
                        void action("remove", { slug: s.slug });
                    }}
                  >
                    Remove {s.shortTitle}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {service && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void action("service", {
                  originalSlug: original,
                  service: {
                    ...service,
                    audience: service.audience.filter(Boolean),
                    preparation: service.preparation.filter(Boolean),
                  },
                });
              }}
            >
              <fieldset disabled={busy}>
                <h3>{original ? "Edit service" : "New service"}</h3>
                {(
                  [
                    "slug",
                    "title",
                    "shortTitle",
                    "label",
                    "description",
                    "headline",
                    "overview",
                    "expectation",
                  ] as const
                ).map((k) => (
                  <Field
                    key={k}
                    title={
                      k === "slug"
                        ? "Page address (lowercase words separated by hyphens)"
                        : label(k.replace(/([A-Z])/g, " $1"))
                    }
                    maxLength={
                      {
                        slug: 120,
                        title: 160,
                        shortTitle: 100,
                        label: 300,
                        description: 1000,
                        headline: 300,
                        overview: 5000,
                        expectation: 3000,
                      }[k]
                    }
                    value={service[k]}
                    long={["overview", "expectation", "description"].includes(k)}
                    onChange={(v) => {
                      setService({ ...service, [k]: v });
                      setUnsaved(true);
                    }}
                  />
                ))}
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={service.enabled}
                    onChange={(e) => {
                      setService({ ...service, enabled: e.target.checked });
                      setUnsaved(true);
                    }}
                  />
                  Enabled after publishing
                </label>
                <Upload
                  title="Service image"
                  path={service.image}
                  onChange={(v) => {
                    setService({ ...service, image: v });
                    setUnsaved(true);
                  }}
                />
                <Field
                  title="Image description"
                  value={service.imageAlt}
                  onChange={(v) => {
                    setService({ ...service, imageAlt: v });
                    setUnsaved(true);
                  }}
                />
                <Rows
                  title="Included item"
                  items={service.includes}
                  keys={["title", "description"]}
                  blank={{ title: "", description: "" }}
                  onChange={(v) => {
                    setService({ ...service, includes: v });
                    setUnsaved(true);
                  }}
                />
                <Lines
                  title="Who this service is for"
                  items={service.audience}
                  onChange={(v) => {
                    setService({ ...service, audience: v });
                    setUnsaved(true);
                  }}
                />
                <Lines
                  title="How to prepare"
                  items={service.preparation}
                  onChange={(v) => {
                    setService({ ...service, preparation: v });
                    setUnsaved(true);
                  }}
                />
                <Rows
                  title="Service question"
                  items={service.faqs}
                  keys={["question", "answer"]}
                  blank={{ question: "", answer: "" }}
                  onChange={(v) => {
                    setService({ ...service, faqs: v });
                    setUnsaved(true);
                  }}
                />
                <h3>Related services</h3>
                {sorted
                  .filter((s) => s.slug !== original && s.slug !== service.slug)
                  .map((s) => (
                    <label className="admin-checkbox" key={s.slug}>
                      <input
                        type="checkbox"
                        checked={service.related.includes(s.slug)}
                        onChange={(e) => {
                          setService({
                            ...service,
                            related: e.target.checked
                              ? [...service.related, s.slug]
                              : service.related.filter((id) => id !== s.slug),
                          });
                          setUnsaved(true);
                        }}
                      />
                      {s.title}
                    </label>
                  ))}
                <button className="button button-primary">Save service draft</button>
              </fieldset>
            </form>
          )}
        </section>
      )}
    </>
  );
}
