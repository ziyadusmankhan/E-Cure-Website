"use client";
export default function Error({ retry }: { retry: () => void }) {
  return (
    <section className="admin-card" role="alert">
      <h1>Workspace temporarily unavailable</h1>
      <p>Your changes could not be loaded. Please try again.</p>
      <button className="button button-primary" onClick={() => retry()}>
        Try again
      </button>
    </section>
  );
}
