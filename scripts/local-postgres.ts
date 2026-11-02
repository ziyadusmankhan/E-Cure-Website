import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";

function postgresBin() {
  if (process.env.PG_BIN) return process.env.PG_BIN;
  if (process.platform === "win32") {
    for (const version of [18, 17, 16, 15, 14]) {
      const bin = `C:/Program Files/PostgreSQL/${version}/bin`;
      if (existsSync(join(bin, "initdb.exe"))) return bin;
    }
  }
  try {
    return execFileSync("pg_config", ["--bindir"], { encoding: "utf8", windowsHide: true }).trim();
  } catch {
    throw new Error("Install PostgreSQL or set PG_BIN to its bin directory.");
  }
}

export function startLocalPostgres(kind: "development" | "test") {
  const root = resolve(kind === "test" ? ".local/database" : ".local/postgres-dev");
  const data = join(root, "data");
  const port = kind === "test" ? 55432 : 55433;
  const bin = postgresBin();
  const exe = (name: string) => join(bin, process.platform === "win32" ? `${name}.exe` : name);
  mkdirSync(root, { recursive: true });
  const secretPath = join(root, "bootstrap-password");
  const applicationPath = join(root, "application-password");
  for (const path of [secretPath, applicationPath])
    if (!existsSync(path))
      writeFileSync(path, randomBytes(32).toString("hex"), { mode: 0o600, flag: "wx" });
  const secret = readFileSync(secretPath, "utf8").trim();
  const applicationPassword = readFileSync(applicationPath, "utf8").trim();
  if (!/^[a-f0-9]{64}$/.test(secret) || !/^[a-f0-9]{64}$/.test(applicationPassword))
    throw new Error("Invalid protected local credentials.");
  if (!existsSync(join(data, "PG_VERSION"))) {
    console.log(`Initializing isolated ${kind} PostgreSQL cluster.`);
    execFileSync(
      exe("initdb"),
      [
        "-D",
        data,
        "-U",
        "postgres",
        "--auth=scram-sha-256",
        "--pwfile",
        secretPath,
        "--encoding=UTF8",
        "--locale=C",
      ],
      { stdio: "ignore", windowsHide: true, timeout: 60_000 },
    );
  }
  let started = false;
  try {
    execFileSync(exe("pg_ctl"), ["-D", data, "status"], {
      stdio: "ignore",
      windowsHide: true,
      timeout: 5000,
    });
  } catch {
    console.log(`Starting isolated ${kind} PostgreSQL on loopback port ${port}.`);
    execFileSync(
      exe("pg_ctl"),
      [
        "-D",
        data,
        "-l",
        join(root, "postgres.log"),
        "-o",
        `-h 127.0.0.1 -p ${port}`,
        "-w",
        "start",
      ],
      { stdio: "ignore", windowsHide: true, timeout: 30_000 },
    );
    started = true;
  }
  return {
    root,
    started,
    applicationPassword,
    url: `postgresql://postgres:${secret}@127.0.0.1:${port}/postgres`,
    stop: () => stopLocalPostgres(kind),
  };
}

export function stopLocalPostgres(kind: "development" | "test") {
  const data = resolve(kind === "test" ? ".local/database/data" : ".local/postgres-dev/data");
  if (!existsSync(join(data, "PG_VERSION"))) return false;
  const bin = postgresBin();
  const control = join(bin, process.platform === "win32" ? "pg_ctl.exe" : "pg_ctl");
  try {
    execFileSync(control, ["-D", data, "status"], {
      stdio: "ignore",
      windowsHide: true,
      timeout: 5000,
    });
  } catch {
    return false;
  }
  execFileSync(control, ["-D", data, "-m", "fast", "-w", "stop"], {
    stdio: "ignore",
    windowsHide: true,
    timeout: 30_000,
  });
  return true;
}
