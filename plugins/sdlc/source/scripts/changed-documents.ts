import {existsSync, readFileSync} from "node:fs";

const filterFilePath = ".github/file-filters.yml";
const fullVerificationFilterNames = ["heavy", "ci_policy"];
const filterKeyPattern = /^([a-z_]+):$/u;
const filterPatternPattern = /^ {2}- "([^"]+)"$/u;
const unsupportedGlobCharacters = /[?[\]{}()\\]/u;
const selfTestFlag = "--self-test";

type PathFilter = {
  excludes: RegExp[];
  includes: RegExp[];
};

/**
 * Turn a glob of the filter file into a regular expression that matches a whole path, dot files included, as `dorny/paths-filter` matches with `dot: true`.
 * @param glob A pattern without its leading `!`; only literal characters, `*`, and `**` are supported.
 * @returns The expression for the glob.
 */
function compileGlob(glob: string): RegExp {
  if (unsupportedGlobCharacters.test(glob)) {
    throw new Error(
      `${filterFilePath}: the pattern "${glob}" uses a glob character this script does not match; use only literal characters, "*", and "**", or extend ${import.meta.filename}`,
    );
  }

  let source = "";
  let index = 0;

  while (index < glob.length) {
    if (glob.startsWith("**/", index)) {
      source += "(?:.*/)?";
      index += 3;
    } else if (glob.startsWith("**", index)) {
      source += ".*";
      index += 2;
    } else if (glob[index] === "*") {
      source += "[^/]*";
      index += 1;
    } else {
      source += (glob[index] ?? "").replaceAll(/[$()*+.?[\\\]^{|}]/gu, String.raw`\$&`);
      index += 1;
    }
  }

  return new RegExp(`^${source}$`, "u");
}

/**
 * Read the filter file's text into one path filter for each key.
 * @param text The content of `.github/file-filters.yml`; only keys at the start of a line, list items of two spaces and a double-quoted pattern, and blank lines are parsed.
 * @returns The include and exclude expressions of each key; a pattern that starts with `!` excludes.
 */
function parseFilters(text: string): Map<string, PathFilter> {
  const filters = new Map<string, PathFilter>();
  let currentFilter: PathFilter | undefined;

  const writtenLines = text
    .split("\n")
    .map((line, lineIndex): [number, string] => [lineIndex, line])
    .filter(([, line]) => line.trim() !== "");

  for (const [lineIndex, line] of writtenLines) {
    const key = filterKeyPattern.exec(line)?.at(1);
    const pattern = filterPatternPattern.exec(line)?.at(1);

    if (key !== undefined) {
      currentFilter = {
        excludes: [],
        includes: [],
      };

      filters.set(key, currentFilter);
    } else if (pattern === undefined || currentFilter === undefined) {
      throw new Error(
        `${filterFilePath}:${lineIndex + 1}: "${line}" is not a shape this script parses; write a key such as "heavy:", then list items such as '  - "**"' under it, or extend ${import.meta.filename}`,
      );
    } else if (pattern.startsWith("!")) {
      currentFilter.excludes.push(compileGlob(pattern.slice(1)));
    } else {
      currentFilter.includes.push(compileGlob(pattern));
    }
  }

  return filters;
}

/**
 * Tell whether CI would run full verification for a changed path, as `predicate-quantifier: some-with-excludes` decides it: a pattern includes the path and no `!` pattern excludes it.
 * @param changedPath A changed path from the repository root, with forward slashes; the file may be deleted.
 * @param filters The filters of the filter file.
 * @returns True when a filter that makes CI run full verification matches the path.
 */
function isFullVerificationPath(changedPath: string, filters: Map<string, PathFilter>): boolean {
  return fullVerificationFilterNames.some(name => {
    const filter = filters.get(name);

    if (filter === undefined) {
      throw new Error(
        `${filterFilePath}: has no "${name}" key, which the "Detect Changes" job reads; restore the key`,
      );
    }

    return (
      filter.includes.some(include => include.test(changedPath)) &&
      filter.excludes.every(exclude => !exclude.test(changedPath))
    );
  });
}

/**
 * Tell whether a set of changed paths holds only documents: no path makes CI run full verification.
 * @param changedPaths The changed paths from the repository root.
 * @param filters The filters of the filter file.
 * @returns False for an empty set, so the full set of checks runs when the changes are unknown.
 */
function areAllDocuments(changedPaths: string[], filters: Map<string, PathFilter>): boolean {
  return (
    changedPaths.length > 0 &&
    changedPaths.every(changedPath => !isFullVerificationPath(changedPath, filters))
  );
}

const sampleFiltersText = [
  "heavy:",
  '  - "**"',
  '  - "!**/*.md"',
  '  - "!.github/CODEOWNERS"',
  '  - "!intent/**"',
  "",
  "ci_policy:",
  '  - ".github/workflows/**"',
  '  - ".agents/**"',
  '  - "!.agents/**/*.md"',
  "",
  "agent_docs:",
  '  - "intent/**"',
  "",
].join("\n");

const sampleFilters = parseFilters(sampleFiltersText);

/**
 * Tell what parsing a filter text does, for a self-test.
 * @param text A filter file's content.
 * @returns The message of the error the parse throws, or an empty string when it parses.
 */
function findParseProblem(text: string): string {
  try {
    parseFilters(text);

    return "";
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

const selfTestCases: [name: string, expected: boolean, actual: boolean][] = [
  [
    "only documents",
    true,
    areAllDocuments(
      ["README.md", "intent/change/plan.md", ".github/CODEOWNERS", ".agents/rules/style.md"],
      sampleFilters,
    ),
  ],
  ["only code", false, areAllDocuments(["src/main.ts", "package.json"], sampleFilters)],
  ["documents and code", false, areAllDocuments(["README.md", "src/main.ts"], sampleFilters)],
  ["an empty list", false, areAllDocuments([], sampleFilters)],
  [
    "a deleted document",
    true,
    areAllDocuments(["docs/a-page-that-no-longer-exists.md"], sampleFilters),
  ],
  [
    "a deleted source file",
    false,
    areAllDocuments(["src/a-file-that-no-longer-exists.ts"], sampleFilters),
  ],
  ["a dot file that is code", false, areAllDocuments([".husky/pre-push"], sampleFilters)],
  ["a workflow", false, areAllDocuments([".github/workflows/ci.yml"], sampleFilters)],
  [
    "a pattern outside the shapes the parser reads",
    true,
    findParseProblem("heavy:\n  - src/**\n").includes("is not a shape this script parses"),
  ],
  [
    "a glob character the matcher does not read",
    true,
    findParseProblem('heavy:\n  - "src/*.{ts,js}"\n').includes("uses a glob character"),
  ],
];

const selfTestFailures = selfTestCases
  .filter(([, expected, actual]) => expected !== actual)
  .map(([name]) => `- ${name}`);

const argumentValues = process.argv.slice(2);

if (selfTestFailures.length > 0) {
  process.stderr.write(`Changed-document self-tests failed:\n${selfTestFailures.join("\n")}\n`);
  process.exitCode = 2;
} else if (argumentValues.includes(selfTestFlag)) {
  process.stdout.write(`Ran ${selfTestCases.length} changed-document self-tests.\n`);
} else if (existsSync(filterFilePath)) {
  const changedPaths = (
    argumentValues.length > 0 ? argumentValues : readFileSync(0, "utf8").split("\n")
  )
    .map(changedPath => changedPath.trim())
    .filter(changedPath => changedPath !== "");

  try {
    const filters = parseFilters(readFileSync(filterFilePath, "utf8"));

    if (!areAllDocuments(changedPaths, filters)) {
      const codePath = changedPaths.find(changedPath =>
        isFullVerificationPath(changedPath, filters),
      );

      process.stdout.write(
        codePath === undefined
          ? "No changed file is known, so the push is not treated as documents.\n"
          : `${codePath} is not a document, so the push is not treated as documents.\n`,
      );

      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
} else {
  process.stderr.write(
    `${filterFilePath} is missing; run this from the repository root, where CI's "Detect Changes" job finds it.\n`,
  );

  process.exitCode = 2;
}
