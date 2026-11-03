import Link from "next/link";
export default function NotFound() {
  return (
    <section className="admin-card">
      <h1>Record unavailable</h1>
      <p>This record may be unavailable or outside your assigned work.</p>
      <Link href="/admin">Return to workspace</Link>
    </section>
  );
}
