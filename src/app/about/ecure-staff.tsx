import { Mail } from "lucide-react";
import Image from "next/image";

const sampleStaff = [
  { name: "Dr. Amir Qureshi", email: "amir.q@example.com", portrait: "01", position: "center 33%" },
  { name: "Dr. Daniel Reed", email: "daniel.r@example.com", portrait: "02", position: "center 65%" },
  { name: "Dr. Sana Mirza", email: "sana.m@example.com", portrait: "03", position: "center 18%" },
  { name: "Dr. David Ellis", email: "david.e@example.com", portrait: "04", position: "center 8%" },
];

export function EcureStaff() {
  return (
    <section className="section ecure-staff" id="meet-our-staff" aria-labelledby="staff-heading">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">Sample profiles</span>
          <h2 id="staff-heading">Meet Our Staff</h2>
          <p>The names and email addresses shown here are placeholders for the website preview.</p>
        </div>
        <ul className="ecure-staff-grid" role="list">
          {sampleStaff.map(({ name, email, portrait, position }) => (
            <li className="ecure-staff-card" key={portrait}>
              <div className="ecure-staff-portrait">
                <Image
                  src={`/images/ecure/staff/portrait-${portrait}.jpg`}
                  alt=""
                  fill
                  sizes="(max-width: 559px) calc(100vw - 40px), (max-width: 979px) 50vw, (min-width: 1352px) 296px, 25vw"
                  style={{ objectPosition: position }}
                />
              </div>
              <div className="ecure-staff-details">
                <h3>{name}</h3>
                <p><Mail size={16} aria-hidden="true" />{email}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
