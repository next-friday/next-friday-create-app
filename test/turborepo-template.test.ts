import {describe, expect, it} from "vitest";
import {readdirSync, readFileSync} from "node:fs";

describe("turborepo template", () => {
  it.each(["dev", "start"])("lets turbo run the %s task of every app at once", script => {
    const manifest = JSON.parse(
      readFileSync(new URL("../templates/turborepo/package.json", import.meta.url), "utf8"),
    ) as {scripts: Record<string, string>};

    const concurrencyMatch = /--concurrency=(?<limit>\d+)/u.exec(manifest.scripts[script] ?? "");
    const concurrency = concurrencyMatch?.groups?.limit;
    const apps = readdirSync(new URL("../templates/turborepo/apps", import.meta.url));

    expect(Number(concurrency)).toBeGreaterThan(apps.length);
  });
});
