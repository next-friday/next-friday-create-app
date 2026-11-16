import {execFileSync} from "node:child_process";
import {existsSync, readFileSync} from "node:fs";

const defaultBranch = "origin/main";
const recordPathPattern = /^intent\/[^/]+\/(?:intent|spec|plan)\.md$/;
const statusPattern = /Status: [a-z]+\./u;
const decisionPattern = /^Decision: /u;
const quotedLineLimit = 60;

/**
 * Run git in the current directory.
 * @param gitArguments Arguments after `git`.
 * @returns Trimmed standard output.
 */
function runGit(gitArguments: string[]): string {
  return execFileSync("git", gitArguments, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

/**
 * Read a file as the default branch holds it.
 * @param mergeBase The commit where this branch left the default branch.
 * @param filePath Path of the file from the repository root.
 * @returns The content, or undefined when the default branch does not hold the file.
 */
function readDefaultBranchFile(mergeBase: string, filePath: string): string | undefined {
  try {
    return runGit(["show", `${mergeBase}:${filePath}`]);
  } catch {
    return undefined;
  }
}

/**
 * Reduce a line to what must stay the same: its text with the status word taken out.
 * @param line A line of a record.
 * @returns The trimmed line, with `Status: <word>.` reduced to `Status:`.
 */
function normalizeLine(line: string): string {
  return line.trim().replace(statusPattern, "Status:");
}

/**
 * Find what a branch removes from an intent, a spec, or a plan that the default branch holds.
 * @param defaultBranchText The file on the default branch, or undefined when it is not there.
 * @param text The file on this branch, or undefined when this branch deletes or moves it.
 * @param isSpec True for a spec, whose decisions the product owner may change.
 * @returns At most one message: the file is gone, or a line is removed or changed in more than its status word.
 */
function findRewriteProblems(
  defaultBranchText: string | undefined,
  text: string | undefined,
  isSpec: boolean,
): string[] {
  if (defaultBranchText === undefined) {
    return [];
  }

  if (text === undefined) {
    return [
      "is on the default branch and this branch deletes or moves it; a record stays where it is, so write a new round in a new folder",
    ];
  }

  const keptLines = new Set(text.split("\n").map(line => normalizeLine(line)));

  const removedLines = defaultBranchText
    .split("\n")
    .map(line => normalizeLine(line))
    .filter(line => line !== "" && !(isSpec && decisionPattern.test(line)) && !keptLines.has(line));

  return removedLines.length === 0
    ? []
    : [
        `is on the default branch and this branch removes ${removedLines.length} of its lines, such as "${removedLines.at(0)?.slice(0, quotedLineLimit) ?? ""}"; change only its status word, or a decision of a spec, and write a new round in a new folder`,
      ];
}

/**
 * Report each intent, spec, and plan of the default branch that this branch deletes, moves, or rewrites.
 * @returns One line per problem, or one line that says the default branch cannot be found.
 */
function findRewriteLines(): string[] {
  let mergeBase = "";

  try {
    mergeBase = runGit(["merge-base", "HEAD", defaultBranch]);
  } catch {
    return [
      `${defaultBranch} cannot be found, so the records cannot be checked; run "git fetch origin main"`,
    ];
  }

  return runGit([
    "-c",
    "core.quotePath=false",
    "diff",
    "--no-renames",
    "--name-only",
    `${mergeBase}...HEAD`,
  ])
    .split("\n")
    .filter(changedPath => recordPathPattern.test(changedPath))
    .flatMap(changedPath =>
      findRewriteProblems(
        readDefaultBranchFile(mergeBase, changedPath),
        existsSync(changedPath) ? readFileSync(changedPath, "utf8") : undefined,
        changedPath.endsWith("/spec.md"),
      ).map(message => `${changedPath}: ${message}`),
    );
}

/**
 * Tell whether a self-test case did not give the expected result.
 * @param expectedPart The part its one message must hold, or undefined when it expects no message.
 * @param problems The messages the case got.
 * @returns True when the case failed.
 */
function isSelfTestFailure(expectedPart: string | undefined, problems: string[]): boolean {
  return expectedPart === undefined
    ? problems.length > 0
    : problems.length !== 1 || !problems.at(0)?.includes(expectedPart);
}

const removedOneLinePart = "removes 1 of its lines";

const selfTestCases: [name: string, expectedPart: string | undefined, problems: string[]][] = [
  [
    "a spec whose status word and decision change",
    undefined,
    findRewriteProblems(
      "# Spec: A\n\nStatus: accepted.\n\n1. A.\n   Decision: yes.\n",
      "# Spec: A\n\nStatus: done.\n\n1. A.\n   Decision: no.\n\nA new line.\n",
      true,
    ),
  ],
  [
    "an intent whose status word changes on the author line",
    undefined,
    findRewriteProblems(
      "Author: @a (Team). Status: accepted.\n",
      "Author: @a (Team). Status: done.\n",
      false,
    ),
  ],
  [
    "a record the default branch does not hold",
    undefined,
    findRewriteProblems(undefined, "# Intent: A\n", false),
  ],
  [
    "a record on the default branch is deleted or moved",
    "deletes or moves it",
    findRewriteProblems("# Plan: A\n", undefined, false),
  ],
  [
    "a record on the default branch is rewritten",
    removedOneLinePart,
    findRewriteProblems(
      "# Intent: A\n\nThe export gives 0.9 reports.\n",
      "# Intent: A\n\nThe export gives 1.0 reports.\n",
      false,
    ),
  ],
  [
    "the author on a status line is rewritten",
    removedOneLinePart,
    findRewriteProblems(
      "Author: @a (Team). Status: accepted.\n",
      "Author: @b (Team). Status: accepted.\n",
      false,
    ),
  ],
  [
    "a decision changes in a file that is not a spec",
    removedOneLinePart,
    findRewriteProblems("Decision: yes.\n", "Decision: no.\n", false),
  ],
];

const selfTestFailures = selfTestCases
  .filter(([, expectedPart, problems]) => isSelfTestFailure(expectedPart, problems))
  .map(([name]) => `- ${name}`);

const problemLines = selfTestFailures.length > 0 ? selfTestFailures : findRewriteLines();

if (problemLines.length > 0) {
  const title = selfTestFailures.length > 0 ? "Record self-tests failed:\n" : "";

  process.stderr.write(`${title}${problemLines.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Ran ${selfTestCases.length} record self-tests and found no rewritten intent, spec, or plan.\n`,
  );
}
