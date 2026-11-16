import {execFileSync} from "node:child_process";
import {existsSync, readFileSync} from "node:fs";

const defaultBranch = "origin/main";
const recordPathPattern = /^intent\/[^/]+\/(?:intent|spec|plan)\.md$/;
const keptLinePattern = /Status: |^\s*Decision: /u;
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
 * Find what a branch removes from an intent, a spec, or a plan that the default branch holds.
 * @param defaultBranchText The file on the default branch, or undefined when it is not there.
 * @param text The file on this branch, or undefined when this branch deletes it.
 * @returns At most one message: the file is deleted, or lines other than its status line and its decisions are removed.
 */
function findRewriteProblems(
  defaultBranchText: string | undefined,
  text: string | undefined,
): string[] {
  if (defaultBranchText === undefined) {
    return [];
  }

  if (text === undefined) {
    return [
      "is on the default branch and this branch deletes it; a record stays, so write a new round in a new folder",
    ];
  }

  const keptLines = new Set(text.split("\n").map(line => line.trim()));

  const removedLines = defaultBranchText
    .split("\n")
    .map(line => line.trim())
    .filter(line => line !== "" && !keptLinePattern.test(line) && !keptLines.has(line));

  return removedLines.length === 0
    ? []
    : [
        `is on the default branch and this branch removes ${removedLines.length} of its lines, such as "${removedLines.at(0)?.slice(0, quotedLineLimit) ?? ""}"; change only its status line and its decisions, and write a new round in a new folder`,
      ];
}

/**
 * Report each intent, spec, and plan of the default branch that this branch deletes or rewrites.
 * @returns One line per problem, and none when the default branch is not available.
 */
function findRewriteLines(): string[] {
  try {
    const mergeBase = runGit(["merge-base", "HEAD", defaultBranch]);

    const statusLines = runGit([
      "-c",
      "core.quotePath=false",
      "diff",
      "--name-status",
      "--find-renames",
      `${mergeBase}...HEAD`,
    ]).split("\n");

    return statusLines
      .filter(line => !line.startsWith("R"))
      .map(line => line.split("\t").at(-1) ?? "")
      .filter(changedPath => recordPathPattern.test(changedPath))
      .flatMap(changedPath =>
        findRewriteProblems(
          readDefaultBranchFile(mergeBase, changedPath),
          existsSync(changedPath) ? readFileSync(changedPath, "utf8") : undefined,
        ).map(message => `${changedPath}: ${message}`),
      );
  } catch {
    return [];
  }
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

const selfTestCases: [name: string, expectedPart: string | undefined, problems: string[]][] = [
  [
    "a record whose status line and decision change",
    undefined,
    findRewriteProblems(
      "# Spec: A\n\nStatus: accepted.\n\n1. A.\n   Decision: yes.\n",
      "# Spec: A\n\nStatus: done.\n\n1. A.\n   Decision: no.\n\nA new line.\n",
    ),
  ],
  [
    "a record the default branch does not hold",
    undefined,
    findRewriteProblems(undefined, "# Intent: A\n"),
  ],
  [
    "a record on the default branch is deleted",
    "this branch deletes it",
    findRewriteProblems("# Plan: A\n", undefined),
  ],
  [
    "a record on the default branch is rewritten",
    "removes 1 of its lines",
    findRewriteProblems(
      "# Intent: A\n\nThe export gives 0.9 reports.\n",
      "# Intent: A\n\nThe export gives 1.0 reports.\n",
    ),
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
