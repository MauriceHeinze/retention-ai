import { chown, mkdir } from "node:fs/promises";

// prepare the root-owned Railway volume directory, then drop privileges
if (process.getuid?.() === 0) {
  if (process.env.RAILWAY_VOLUME_MOUNT_PATH !== "/app/.retentionai") {
    throw new Error("Expected the RetentionAI data volume before starting as root");
  }
  await mkdir("/app/.retentionai/jobs", { recursive: true, mode: 0o700 });
  await chown("/app/.retentionai/jobs", 1000, 1000);
  process.setgroups!([]);
  process.setgid!(1000);
  process.setuid!(1000);
}
await import("./server.js");
