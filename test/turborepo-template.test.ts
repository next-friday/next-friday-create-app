import {describe, expect, it} from "vitest";
import {readdirSync, readFileSync} from "node:fs";

describe("turborepo template", () => {
  it("lets turbo run the dev task of every app at once", () => {
    const turbo = JSON.parse(
      readFileSync(new URL("../templates/turborepo/turbo.json", import.meta.url), "utf8"),
    ) as {concurrency: string};

    const apps = readdirSync(new URL("../templates/turborepo/apps", import.meta.url));

    expect(Number(turbo.concurrency)).toBeGreaterThan(apps.length);
  });
});
