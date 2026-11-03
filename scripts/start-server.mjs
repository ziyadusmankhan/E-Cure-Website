import nextEnv from "@next/env";
import { spawn } from "node:child_process";

const command = process.argv[2];
const { loadEnvConfig } = nextEnv;
if (!["dev", "start"].includes(command)) throw new Error("Unsupported server command.");
loadEnvConfig(process.cwd(), command === "dev");
const localTest = process.env.SUBMISSIONS_MODE === "local-test" || process.env.ADMIN_AUTH_MODE === "local";
const args = process.argv.slice(3);
if (localTest && args.some((arg) => arg.startsWith("-H") || arg.startsWith("--hostname")))
  throw new Error("Local test submissions require the loopback-only listener.");
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    command,
    "--hostname",
    localTest ? "127.0.0.1" : "0.0.0.0",
    ...args,
  ],
  { stdio: "inherit", env: process.env, windowsHide: true },
);
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("error", () => {
  console.error("The Next.js server could not start.");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 0;
});
