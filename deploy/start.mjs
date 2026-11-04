// Preserve the local server's loopback-only testing boundary in cloud images.
// Supply live production service settings, or leave services disabled for review.
if (process.env.ADMIN_AUTH_MODE === "local" || process.env.SUBMISSIONS_MODE === "local-test") {
  console.error("Local-only authentication/submission modes cannot run in the cloud image. Use live service settings or disabled review modes.");
  process.exit(1);
}
await import("./server.js");
