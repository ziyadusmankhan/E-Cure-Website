import Image from "next/image";

const physiotherapists = [
  {
    name: "Dr Daim Aziz",
    portrait: "/images/ecure/staff/dr-daim-aziz.jpg",
    position: "center",
  },
  {
    name: "Dr Muhammad",
    portrait: "/images/ecure/staff/dr-muhammad-portrait.jpg",
    position: "center top",
  },
];

const staff = [
  { role: "Physiotherapists", count: 8, detail: "doctors" },
  { role: "Nurses", count: 35, detail: "registered nurses" },
  { role: "Caretakers", count: 15, detail: "caretakers" },
  { role: "Respiratory Therapists", count: 5, detail: "respiratory therapists" },
  { role: "Speech Therapists", count: 5, detail: "speech therapists" },
  { role: "Medical Consultants", count: 10, detail: "medical consultants" },
];

export function EcureStaff() {
  return (
    <section className="section ecure-staff" id="meet-our-staff" aria-labelledby="staff-heading">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">THE E-CURE TEAM</span>
          <h2 id="staff-heading">Meet Our Staff</h2>
        </div>
        <ul className="ecure-staff-profiles" role="list">
          {physiotherapists.map(({ name, portrait, position }) => (
            <li className="ecure-staff-profile" key={name}>
              <div className="ecure-staff-photo">
                <Image
                  src={portrait}
                  alt={`Portrait of ${name}`}
                  fill
                  sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 900px) 46vw, 410px"
                  style={{ objectPosition: position }}
                />
              </div>
              <div className="ecure-staff-profile-info">
                <h3>{name}</h3>
                <p>Physiotherapist (DPT)</p>
              </div>
            </li>
          ))}
        </ul>
        <section className="ecure-staff-summary" id="our-staff" aria-labelledby="staff-summary-heading">
          <h3 id="staff-summary-heading">Our Staff</h3>
          <ul className="ecure-staff-grid" role="list">
            {staff.map(({ role, count, detail }) => (
              <li className="ecure-staff-card" key={role}>
                <h4>{role}</h4>
                <p><strong>{count}</strong> {detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
