import "server-only";
import { BackendError } from "./errors";

export function connectionSettings(
  value: string | undefined,
  purpose: "runtime" | "migration" | "test",
) {
  try {
    if (!value) throw new Error();
    const url = new URL(value);
    const local = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      !url.username ||
      !url.password ||
      url.pathname.length < 2
    )
      throw new Error();
    if (purpose === "migration" && url.port === "6543") throw new Error();
    if (
      purpose === "runtime" &&
      !/^healthcare_app(?:\.[a-z0-9-]+)?$/.test(decodeURIComponent(url.username))
    )
      throw new Error();
    if (
      !local &&
      ["disable", "allow", "prefer", "no-verify"].includes(url.searchParams.get("sslmode") ?? "")
    )
      throw new Error();
    // SSL is controlled here, rather than weakened by URL parameters.
    for (const key of ["sslmode", "ssl", "sslcert", "sslkey", "sslrootcert"])
      url.searchParams.delete(key);
    return {
      url: url.toString(),
      ssl: local ? (false as const) : { rejectUnauthorized: true },
      max: purpose === "runtime" ? 5 : 1,
      prepare: false as const,
      connect_timeout: 10,
      idle_timeout: 20,
    };
  } catch {
    throw new BackendError("CONFIGURATION");
  }
}

export function assertTestDatabase(
  value: string | undefined,
  forbidden: (string | undefined)[] = [],
) {
  const options = connectionSettings(value, "test");
  const url = new URL(options.url);
  if (
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
    !/^healthcare_[a-z0-9_]*test(?:_[a-z0-9]+)?$/.test(url.pathname.slice(1))
  )
    throw new BackendError("CONFIGURATION");
  for (const other of forbidden.filter(Boolean)) {
    const target = new URL(other!);
    const host = (name: string) =>
      ["localhost", "127.0.0.1", "[::1]"].includes(name) ? "loopback" : name;
    if (
      host(target.hostname) === host(url.hostname) &&
      (target.port || "5432") === (url.port || "5432") &&
      target.pathname === url.pathname
    )
      throw new BackendError("CONFIGURATION");
  }
  return options;
}
