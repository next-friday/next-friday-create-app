import {execFileSync} from "node:child_process";
import {existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import path from "node:path";
import {tmpdir} from "node:os";

const defaultBranch = "origin/main";
const intentDirectory = "intent";
const statusLineLimit = 5;
const acceptedByPrefix = "Accepted by: ";

/**
 * Run git in the current directory.
 * @param gitArguments Arguments after `git`.
 * @returns Trimmed standard output.
 */
function runGit(gitArguments: string[]): string {
  return execFileSync("git", gitArguments, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/**
 * Blank every line of a fenced code block, keeping line numbers.
 * @param lines Document lines.
 * @returns The lines with fenced ones emptied.
 */
function maskFencedBlocks(lines: string[]): string[] {
  let isFenced = false;

  return lines.map(line => {
    const isFence = /^\s*(?:```|~~~)/.test(line);
    const isMasked = isFenced || isFence;

    isFenced = isFence ? !isFenced : isFenced;

    return isMasked ? "" : line;
  });
}

/**
 * Split a document into LF-terminated lines without a byte order mark.
 * @param text Document content.
 * @returns The lines.
 */
function splitLines(text: string): string[] {
  return text
    .replace(/^\u{FEFF}/u, "")
    .replaceAll("\r\n", "\n")
    .split("\n");
}

/**
 * Find the lines of a level-2 section.
 * @param maskedLines Document lines with fenced code blocks emptied.
 * @param heading The section heading.
 * @returns The first line after the heading and the line of the next level-2 heading, or undefined when the heading is absent.
 */
function findSectionBounds(maskedLines: string[], heading: string): [number, number] | undefined {
  const start = maskedLines.findIndex(line => line.trimEnd() === heading);

  if (start === -1) {
    return undefined;
  }

  const nextHeading = maskedLines.findIndex(
    (line, index) => index > start && line.startsWith("## "),
  );

  return [start + 1, nextHeading === -1 ? maskedLines.length : nextHeading];
}

/**
 * Collect the text of a level-2 section.
 * @param maskedLines Document lines with fenced code blocks emptied.
 * @param heading The section heading.
 * @returns The lines under the heading up to the next level-2 heading, or undefined when the heading is absent.
 */
function readSection(maskedLines: string[], heading: string): string[] | undefined {
  const bounds = findSectionBounds(maskedLines, heading);

  return bounds === undefined ? undefined : maskedLines.slice(...bounds);
}

const concernsHeading = "## Areas of concern";
const decisionPrefix = "Decision: ";
const decisionPattern = /^ *Decision: \S/mu;
const authorPrefix = "Author: ";
const authorPattern = /^Author: @[\dA-Za-z][\w-]*[ .]/;

type BranchChanges = {
  changedPaths: string[];
  headCommit: string;
  mergeBase: string;
};

type SelfTestCase = {
  expectedMessagePart?: string;
  name: string;
  problems: string[];
};

/**
 * Find each numbered area of concern in a spec that carries no decision.
 * @param specText Spec content.
 * @returns At most one message, which names the numbers.
 */
function findDecisionProblems(specText: string): string[] {
  const undecidedNumbers = (
    readSection(maskFencedBlocks(splitLines(specText)), concernsHeading) ?? []
  )
    .join("\n")
    .split(/^(?=\d+\. )/mu)
    .filter(concern => /^\d+\. /u.test(concern) && !decisionPattern.test(concern))
    .map(concern => /^\d+/u.exec(concern)?.[0]);

  return undecidedNumbers.length === 0
    ? []
    : [
        `area of concern ${undecidedNumbers.join(", ")} has no "${decisionPrefix}<the decision>." line under it; write the proposed decision there, and the product owner corrects it before merging the spec`,
      ];
}

/**
 * Find an intent whose author is not a handle on the host.
 * @param intentText Intent content.
 * @returns At most one message.
 */
function findAuthorProblems(intentText: string): string[] {
  const authorLine = splitLines(intentText).find(line => line.startsWith(authorPrefix));

  return authorLine !== undefined && authorPattern.test(authorLine)
    ? []
    : [
        `the "${authorPrefix}" line holds no handle; write "${authorPrefix}@<handle> (<team>)." with the originator's account on the host`,
      ];
}

const planFileName = "plan.md";
const specFileName = "spec.md";
const intentFileName = "intent.md";
const proofHeading = "## Proof";
const requirementsHeading = "## Requirements";
const acceptancePlaceholder = "@<engineer>";
const acceptedByPattern = /^Accepted by: @[\dA-Za-z][\w-]*\.$/;
const requiredHeadings = ["## Files that change", "## Order of work", "## Risks", proofHeading];

/**
 * Find what this branch changed since it left the default branch.
 * @returns The merge base, HEAD, and the changed paths, or undefined when the default branch is not available.
 */
function findBranchChanges(): BranchChanges | undefined {
  try {
    const mergeBase = runGit(["merge-base", "HEAD", defaultBranch]);

    return {
      mergeBase,
      headCommit: runGit(["rev-parse", "HEAD"]),
      changedPaths: runGit([
        "-c",
        "core.quotePath=false",
        "diff",
        "--name-only",
        `${mergeBase}...HEAD`,
      ])
        .split("\n")
        .filter(changedPath => changedPath !== ""),
    };
  } catch {
    return undefined;
  }
}

/**
 * Tell whether a plan must name its accepting engineer: the branch changes a file outside `intent/`.
 * @param branchChanges What the branch changed, or undefined when no merge base was found.
 * @returns False when there is no merge base or HEAD is the default branch tip.
 */
function requiresAcceptance(branchChanges: BranchChanges | undefined): boolean {
  return (
    branchChanges !== undefined &&
    branchChanges.mergeBase !== branchChanges.headCommit &&
    branchChanges.changedPaths.some(changedPath => !changedPath.startsWith(`${intentDirectory}/`))
  );
}

/**
 * Say why the acceptance rule cannot run.
 * @param branchChanges What the branch changed, or undefined when no merge base was found.
 * @returns A problem when the default branch is not available, otherwise undefined.
 */
function describeMissingDefaultBranch(
  branchChanges: BranchChanges | undefined,
): string | undefined {
  return branchChanges === undefined
    ? `${defaultBranch} cannot be found, so the "${acceptedByPrefix}" rule cannot be applied; run "git fetch origin main" to apply it`
    : undefined;
}

/**
 * Quote each heading and join them for a message.
 * @param headings Heading texts.
 * @returns The quoted list, or "none" when there is no heading.
 */
function quoteHeadings(headings: string[]): string {
  return headings.length === 0 ? "none" : headings.map(heading => `"${heading}"`).join(", ");
}

/**
 * Find level-2 headings that differ from the template's, in count, spelling, or order.
 * @param maskedLines Plan lines with fenced code blocks emptied.
 * @returns At most one message.
 */
function findHeadingProblems(maskedLines: string[]): string[] {
  const headings = maskedLines.map(line => line.trimEnd()).filter(line => line.startsWith("## "));

  return headings.join("\n") === requiredHeadings.join("\n")
    ? []
    : [
        `the level-2 headings must be exactly, in order: ${quoteHeadings(requiredHeadings)}; found ${quoteHeadings(headings)}`,
      ];
}

/**
 * Find a missing or placeholder `Accepted by:` line when the branch changes a file outside `intent/`.
 * @param maskedLines Plan lines with fenced code blocks emptied.
 * @param isAcceptanceRequired Whether the branch changes a file outside `intent/`.
 * @returns At most one message.
 */
function findAcceptanceProblems(maskedLines: string[], isAcceptanceRequired: boolean): string[] {
  const acceptedLine = maskedLines.slice(1).find(line => line.trim() !== "");

  return !isAcceptanceRequired ||
    (acceptedLine !== undefined && acceptedByPattern.test(acceptedLine.trimEnd()))
    ? []
    : [
        `the plan has no "${acceptedByPrefix}<engineer>." line directly under its title, or it holds ${acceptancePlaceholder} or no GitHub login, and this branch changes a file outside ${intentDirectory}/; write the engineer who accepted the plan`,
      ];
}

/**
 * Read the numbers of the requirements in a spec.
 * @param specLines Spec lines.
 * @returns Each distinct number of a top-level list item under `## Requirements`, in order.
 */
function readRequirementNumbers(specLines: string[]): number[] {
  const numbers = (readSection(maskFencedBlocks(specLines), requirementsHeading) ?? [])
    .map(line => /^(\d+)\. /.exec(line)?.at(1) ?? "")
    .filter(digits => digits !== "")
    .map(Number);

  return [...new Set(numbers)];
}

/**
 * Read the label of a Proof line: the text before the first colon of a paragraph or list item, or the first cell of a table row.
 * @param line One line of the Proof section.
 * @returns The label, or an empty string when the line has none.
 */
function readProofLabel(line: string): string {
  const text = line.trim();

  if (text.startsWith("|")) {
    return text.split("|", 2).at(1)?.trim() ?? "";
  }

  const item = text.replace(/^(?:[-*+]|\d+[.)])\s+/, "");
  const colon = item.indexOf(":");

  return colon === -1 ? "" : item.slice(0, colon).replaceAll(/[*_`]/g, "").trim();
}

/**
 * Read the requirement numbers a label names: `1`, `1, 2, 8`, `1 and 2`, or a range such as `3–5`, `3-5`, or `3 to 5`, with an optional "Requirement" prefix.
 * @param label The label of a Proof line.
 * @param largestNumber The largest requirement number of the spec, which bounds a range.
 * @returns The named numbers; empty when the label holds anything else, such as `1.2.3`.
 */
function readNamedNumbers(label: string, largestNumber: number): Set<number> {
  const numbers = label.replace(/^requirements?\s+/i, "");
  const named = new Set<number>();

  if (numbers.replaceAll(/\d+|[–\-,\s]|\band\b|\bto\b/g, "") !== "") {
    return named;
  }

  const tokens = Array.from(numbers.matchAll(/\d+|[–-]|\bto\b/g), ([token]) => token);

  for (const [index, token] of tokens.entries()) {
    const first = Number(token);
    const last = Number(tokens.at(index + 2));

    if (Number.isSafeInteger(first)) {
      named.add(first);
    }

    if (
      Number.isSafeInteger(first) &&
      Number.isNaN(Number(tokens.at(index + 1))) &&
      Number.isSafeInteger(last)
    ) {
      for (let number = first; number <= Math.min(last, largestNumber); number += 1) {
        named.add(number);
      }
    }
  }

  return named;
}

/**
 * Find a spec that has no numbered requirement.
 * @param specLines Spec lines.
 * @returns At most one message.
 */
function findRequirementProblems(specLines: string[]): string[] {
  return readRequirementNumbers(specLines).length > 0
    ? []
    : [
        `${specFileName} has no numbered requirement under "${requirementsHeading}"; write each requirement as a top-level "1." list item`,
      ];
}

/**
 * Find a Proof section that leaves a requirement of the spec unnamed in its line labels.
 * @param maskedLines Plan lines with fenced code blocks emptied.
 * @param specLines Spec lines.
 * @returns At most one message.
 */
function findProofProblems(maskedLines: string[], specLines: string[]): string[] {
  const proof = readSection(maskedLines, proofHeading);

  if (proof === undefined) {
    return [];
  }

  const requirements = readRequirementNumbers(specLines);
  const largestNumber = Math.max(0, ...requirements);

  const named = new Set(
    proof.flatMap(line => [...readNamedNumbers(readProofLabel(line), largestNumber)]),
  );

  const missing = requirements.filter(number => !named.has(number));

  return missing.length === 0
    ? []
    : [
        `the section "${proofHeading}" does not name requirement ${missing.join(", ")} of ${specFileName} in a line label; start each line with its number or numbers and a colon, such as "1, 2:" or "3–5:", or put them in the first table cell`,
      ];
}

/**
 * Find an empty Proof section in a plan that has no spec to prove.
 * @param lines Plan lines.
 * @param maskedLines Plan lines with fenced code blocks emptied.
 * @returns At most one message.
 */
function findFixProofProblems(lines: string[], maskedLines: string[]): string[] {
  const bounds = findSectionBounds(maskedLines, proofHeading);

  return bounds === undefined || lines.slice(...bounds).some(line => line.trim() !== "")
    ? []
    : [
        `the section "${proofHeading}" is empty; name the test that fails today and passes once the cause is fixed`,
      ];
}

/**
 * Tell whether a change folder holds a fix plan: a plan with neither an intent nor a spec.
 * @param folder The `intent/<change>` folder.
 * @returns True when the folder has no `intent.md` and no `spec.md`.
 */
function isFixPlanFolder(folder: string): boolean {
  return (
    !existsSync(path.join(folder, intentFileName)) && !existsSync(path.join(folder, specFileName))
  );
}

const headReferenceVariable = "GITHUB_HEAD_REF";
const fixBranchPrefix = "fix/";
const fixTitleSuffix = "(fix)";

/**
 * Read the name of the branch under check.
 * @param environment The process environment; CI sets `GITHUB_HEAD_REF` for a pull request, whose checkout has no branch name.
 * @returns The branch name.
 */
function readBranchName(environment: Record<string, string | undefined> = process.env): string {
  const headReference = environment[headReferenceVariable];

  return headReference === undefined || headReference === ""
    ? runGit(["branch", "--show-current"])
    : headReference;
}

/**
 * Find a plan with no intent and no spec that `playbooks/fix.md` does not allow: only a fix plan, titled "(fix)" on a `fix/` branch, skips the intent and the spec.
 * @param planText The plan's content.
 * @param branchName The branch under check.
 * @returns At most one message.
 */
function findPlanOnlyProblems(planText: string, branchName: string): string[] {
  const isFixTitle = (splitLines(planText).at(0) ?? "").trimEnd().endsWith(fixTitleSuffix);
  const message = `the folder has no ${intentFileName} and no ${specFileName}; only a bug fix, titled "${fixTitleSuffix}" on a "${fixBranchPrefix}" branch, may skip them. Start from an intent with /sdlc-mode`;

  return isFixTitle && branchName.startsWith(fixBranchPrefix) ? [] : [message];
}

const planPathPattern = /^intent\/[^/]+\/plan\.md$/;
const recordPathPattern = /^intent\/[^/]+\/(?:intent|spec)\.md$/;
const loopSpecPath = "intent/a/spec.md";

/**
 * Find a branch in the SDLC loop that changes code with no plan: work that changes an intent or a spec of a change is in the loop, and its code goes with the plan the engineer accepted.
 * @param changedPaths The paths the branch changed since it left the default branch.
 * @returns At most one message.
 */
function findLoopPlanProblems(changedPaths: string[]): string[] {
  const isInLoop = changedPaths.some(changedPath => recordPathPattern.test(changedPath));

  const isChangesCode = changedPaths.some(
    changedPath => !changedPath.startsWith(`${intentDirectory}/`),
  );

  const hasPlan = changedPaths.some(changedPath => planPathPattern.test(changedPath));

  return isInLoop && isChangesCode && !hasPlan
    ? [
        `this branch changes an ${intentFileName} or a ${specFileName} and files outside ${intentDirectory}/, and adds or changes no ${intentDirectory}/<change>/${planFileName}; commit the plan the engineer accepted in the same pull request`,
      ]
    : [];
}

const testDirectoryPattern = /(?:^|\/)(?:tests?|e2e|__tests__)\//;
const testFilePattern = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const testChangeAcceptedPattern = /^Test change accepted by: @[\dA-Za-z][\w-]*\.$/m;

/**
 * Find a fix that edits a test the default branch already holds.
 * @param modifiedPaths The paths the branch modified that the default branch already held.
 * @param planText The fix plan's content.
 * @returns At most one message.
 */
function findFixTestEditProblems(modifiedPaths: string[], planText: string): string[] {
  const editedTests = modifiedPaths.filter(
    modifiedPath => testDirectoryPattern.test(modifiedPath) || testFilePattern.test(modifiedPath),
  );

  return editedTests.length === 0 || testChangeAcceptedPattern.test(planText)
    ? []
    : [
        `this fix changes ${editedTests.join(", ")}, which the default branch already holds; fix the code, not the test, or a code owner who accepts the change writes "Test change accepted by: @<handle>." in the plan`,
      ];
}

/**
 * Find a missing spec, or a spec the plan does not prove.
 * @param maskedLines Plan lines with fenced code blocks emptied.
 * @param specText Content of the `spec.md` beside the plan, or undefined when there is none.
 * @returns One message per problem.
 */
function findSpecProblems(maskedLines: string[], specText: string | undefined): string[] {
  if (specText === undefined) {
    return [`there is no ${specFileName} beside the plan; write the spec the plan builds`];
  }

  const specLines = splitLines(specText);

  return [...findRequirementProblems(specLines), ...findProofProblems(maskedLines, specLines)];
}

/**
 * Check one plan against the template in `playbooks/build.md` of the `sdlc-mode` skill and the spec beside it.
 * @param planText Plan content.
 * @param specText Content of the `spec.md` beside the plan, or undefined when there is none.
 * @param isAcceptanceRequired Whether the branch changes a file outside `intent/`.
 * @param isFixPlan Whether the folder holds a fix plan, which has no spec to prove.
 * @returns One message per problem.
 */
function checkPlan(
  planText: string,
  specText: string | undefined,
  isAcceptanceRequired: boolean,
  isFixPlan = false,
): string[] {
  const lines = splitLines(planText);
  const maskedLines = maskFencedBlocks(lines);

  return [
    ...findHeadingProblems(maskedLines),
    ...findAcceptanceProblems(maskedLines, isAcceptanceRequired),
    ...(isFixPlan
      ? findFixProofProblems(lines, maskedLines)
      : findSpecProblems(maskedLines, specText)),
  ];
}

/**
 * Tell whether a spec says `Status: done.` at the end of a line.
 * @param specText Spec content.
 * @returns True when the tree meets every requirement of the spec.
 */
function isDoneSpec(specText: string): boolean {
  return maskFencedBlocks(splitLines(specText)).some(line =>
    /Status: done\.$/.test(line.trimEnd()),
  );
}

/**
 * Find a done spec that has no plan.
 * @param specText Spec content.
 * @param hasPlan Whether the folder has a `plan.md`.
 * @returns At most one message.
 */
function findMissingPlanProblems(specText: string, hasPlan: boolean): string[] {
  return hasPlan || !isDoneSpec(specText)
    ? []
    : [
        `${specFileName} says "Status: done." and the folder has no ${planFileName}; write the plan that built the change`,
      ];
}

const addedStatuses = new Set(["accepted", "rejected"]);

/**
 * Read the status a document gives on its status line.
 * @param text Intent or spec content.
 * @returns The word after `Status:`, such as `accepted`, or undefined when there is no status line.
 */
function readStatus(text: string): string | undefined {
  return splitLines(text)
    .slice(0, statusLineLimit)
    .map(line => /Status: ([a-z]+)\.$/.exec(line.trimEnd())?.at(1))
    .find(status => status !== undefined);
}

/**
 * Find an intent or a spec that its pull request adds with a status that merging it would make wrong.
 * A file the default branch already holds may carry any status line, or none.
 * @param status The status the branch writes, or undefined when there is none.
 * @param isAdded Whether the branch adds the file, which the default branch does not have yet.
 * @param isPlanMerged Whether the folder's `plan.md` is already on the default branch, so the change was built before this file was written.
 * @returns At most one message, and none for a file the branch does not add.
 */
function findStatusProblems(
  status: string | undefined,
  isAdded: boolean,
  isPlanMerged = false,
): string[] {
  const isDecision =
    status !== undefined && (addedStatuses.has(status) || (isPlanMerged && status === "done"));

  return !isAdded || isDecision
    ? []
    : [
        `the pull request that adds this file writes "Status: accepted.", or "Status: rejected." with the reason, because merging it is the decision`,
      ];
}

const doneMessage =
  'the build pull request sets "Status: done." here; when a requirement stays unmet, its description names it';

/**
 * Tell whether a folder holds a build plan: the branch changes code and the folder's existing plan, beside a spec.
 * @param folder The `intent/<change>` folder.
 * @param changedPaths The paths the branch changed, with forward slashes.
 * @param isCodeChanged Whether the branch changes a file outside `intent/`.
 * @returns True when the build pull request must mark the change done.
 */
function isBuildPlan(folder: string, changedPaths: string[], isCodeChanged: boolean): boolean {
  const planPath = path.join(folder, planFileName);

  return (
    isCodeChanged &&
    existsSync(planPath) &&
    changedPaths.includes(planPath.split(path.sep).join("/")) &&
    existsSync(path.join(folder, specFileName))
  );
}

/**
 * Find each document of a build plan's folder that does not say done.
 * @param documents The path and status of the folder's intent and spec; a missing file has no status.
 * @returns One line per document that does not say `Status: done.`
 */
function findDoneProblems(documents: [string, string | undefined][]): string[] {
  return documents
    .filter(([, status]) => status !== "done")
    .map(([filePath]) => `${filePath}: ${doneMessage}`);
}

const proofSpec = [
  "# Spec: Health check answers 200",
  "",
  "From `intent/health/intent.md`. Status: accepted.",
  "",
  requirementsHeading,
  "",
  "1. A.",
  "2. B.",
  "3. C.",
  "4. D.",
  "5. E.",
  "",
  "## Design",
  "",
  "1. Not a requirement.",
  "",
].join("\n");

const allUnnamedPart = "does not name requirement 1, 2, 3, 4, 5";
const headingsMessagePart = "level-2 headings";
const acceptanceRequiredProblem = "acceptance is required";
const doneSpec = proofSpec.replace("Status: accepted.", "Status: done.");
const placeholderLine = `${acceptedByPrefix}${acceptancePlaceholder}.`;
const engineerLine = `${acceptedByPrefix}@engineer.`;

type PlanParts = {
  accepted?: string;
  body?: string;
  headings?: string[];
  proof?: string;
};

/**
 * Build a plan from its parts.
 * @param parts The `Accepted by:` line, the text of each section but Proof, the headings, and the text of Proof.
 * @returns The plan content.
 */
function buildPlan(parts: PlanParts): string {
  const {
    body = "Text.",
    proof = "Requirements 1-5: proven.",
    accepted = engineerLine,
    headings = requiredHeadings,
  } = parts;

  return [
    "# Plan: Health check answers 200",
    "",
    accepted,
    "",
    ...headings.flatMap(heading => [heading, "", heading === proofHeading ? proof : body, ""]),
  ].join("\n");
}

/**
 * Check a self-test plan against the self-test spec.
 * @param planText Plan content.
 * @param isAcceptanceRequired Whether the branch changes a file outside `intent/`.
 * @returns One message per problem.
 */
function checkAgainstProofSpec(planText: string, isAcceptanceRequired = true): string[] {
  return checkPlan(planText, proofSpec, isAcceptanceRequired);
}

const branchWithCode: BranchChanges = {
  headCommit: "bbb",
  mergeBase: "aaa",
  changedPaths: ["intent/health/plan.md", "src/health.ts"],
};

const intentBranch: BranchChanges = {
  ...branchWithCode,
  changedPaths: ["intent/health/plan.md"],
};

/**
 * Create a change folder that holds the named files, for a self-test.
 * @param fileNames The files to create in the folder.
 * @returns The folder path.
 */
function createChangeFolder(fileNames: string[]): string {
  const folder = mkdtempSync(path.join(tmpdir(), "plan-check-"));

  for (const fileName of fileNames) {
    writeFileSync(path.join(folder, fileName), "");
  }

  return folder;
}

const fixPlanFolder = createChangeFolder([planFileName]);
const intentOnlyFolder = createChangeFolder([intentFileName, planFileName]);
const specOnlyFolder = createChangeFolder([specFileName, planFileName]);
const buildFolder = createChangeFolder([intentFileName, specFileName, planFileName]);
const deletedPlanFolder = createChangeFolder([intentFileName, specFileName]);
const fixBranch = "fix/health";
const notDecisionMessage = "merging it is the decision";
const doneLine = "Status: done.";
const draftLine = "Status: draft.";
const intentStartMessage = "Start from an intent";

const planOnlyCases: [string, string, string, string?][] = [
  ["fix.md 4, 6: a (fix) plan on fix/ skips the spec", "a (fix)", fixBranch],
  ["fix.md 6: a (fix) plan off fix/ may not", "a (fix)", "feat/a", intentStartMessage],
  ["fix.md 4: a plan with no (fix) may not", "a", fixBranch, intentStartMessage],
];

const statusCases: [string, string, boolean, boolean, string?][] = [
  ["adds done beside a merged plan", doneLine, true, true],
  ["adds done with no merged plan", doneLine, true, false, notDecisionMessage],
  ["adds accepted", "Status: accepted.", true, false],
  ["adds rejected", "Status: rejected.", true, false],
  ["adds draft", draftLine, true, false, notDecisionMessage],
  ["marks a merged file done", doneLine, false, false],
  ["removes a merged status line", "# Intent: a", false, false],
  ["sets a merged file to draft", draftLine, false, false],
];

type DoneCase = [string, string, BranchChanges, string | undefined, string | undefined, string?];

const donePart = 'sets "Status: done." here';

const selfTestPlanPaths = [buildFolder, intentOnlyFolder, deletedPlanFolder].map(folder =>
  path.join(folder, planFileName).split(path.sep).join("/"),
);

const doneCases: DoneCase[] = [
  ["a build branch without done fails", buildFolder, branchWithCode, "done", "accepted", donePart],
  ["a build branch with done passes", buildFolder, branchWithCode, "done", "done"],
  ["a folder already done passes", buildFolder, branchWithCode, "done", "done"],
  ["a missing intent.md fails", buildFolder, branchWithCode, undefined, "done", donePart],
  ["a branch that changes only intent/ passes", buildFolder, intentBranch, "accepted", "accepted"],
  ["a folder with no spec.md passes", intentOnlyFolder, branchWithCode, "accepted", "accepted"],
  ["a deleted plan passes", deletedPlanFolder, branchWithCode, "accepted", "accepted"],
];

const acceptedLineCases: [string, string][] = [
  ["the accepting engineer is missing", ""],
  ["the accepting engineer is the placeholder", placeholderLine],
  ["the accepting engineer is empty", `${acceptedByPrefix}.`],
  ["the accepting line is not directly under the title", `From the spec.\n\n${engineerLine}`],
];

const proofCases: [string, string, string?][] = [
  [
    "Proof leaves requirements unnamed",
    "Requirements 1, 2 and 4: proven.",
    "does not name requirement 3, 5",
  ],
  ["Proof names numbers alone and in a list", "1, 2, 3 and 4: proven.\n\n5: proven."],
  ["Proof names a range with an en dash", "Requirements 1–5: proven."],
  ["Proof names a range with a hyphen", "Requirements 1-5: proven."],
  ["Proof names a range with the word to", "Requirements 1 to 5: proven."],
  ["a version in a label does not count", "Requirement 1.2.3: proven.", allUnnamedPart],
  [
    "a number after the colon does not count",
    "1: also covers 2, 3 and 4-5 on 2026-11-11.",
    "does not name requirement 2, 3, 4, 5",
  ],
  ["a line without a label names nothing", "Requirements 1-5 are proven.", allUnnamedPart],
  [
    "Proof names requirements with and in a list item",
    "- Requirements 1 and 2: proven.\n- 3, 4, 5: proven.",
  ],
  [
    "Proof names requirements in the first table cell",
    "| Requirement | Check |\n| :- | :- |\n| 1–5 | proven |",
  ],
  [
    "a huge range is bounded by the largest requirement number and does not throw",
    "1 to 99999999999999: proven.",
  ],
];

const selfTestCases: SelfTestCase[] = [
  {
    name: "a complete plan",
    problems: checkAgainstProofSpec(buildPlan({})),
  },
  {
    expectedMessagePart: headingsMessagePart,
    name: "a heading is misspelled",
    problems: checkAgainstProofSpec(
      buildPlan({
        headings: requiredHeadings.map(heading => heading.replace("Risks", "Risk")),
      }),
    ),
  },
  {
    expectedMessagePart: headingsMessagePart,
    name: "headings are out of order",
    problems: checkAgainstProofSpec(
      buildPlan({
        headings: requiredHeadings.toReversed(),
      }),
    ),
  },
  {
    name: "a heading inside a fenced block is ignored",
    problems: checkAgainstProofSpec(
      buildPlan({
        body: "```\n## Extra\n```",
      }),
    ),
  },
  ...acceptedLineCases.map(([name, accepted]) => ({
    name,
    expectedMessagePart: acceptedByPrefix,
    problems: checkAgainstProofSpec(
      buildPlan({
        accepted,
      }),
    ),
  })),
  {
    name: "a placeholder is allowed when acceptance is not required",
    problems: checkAgainstProofSpec(
      buildPlan({
        accepted: placeholderLine,
      }),
      false,
    ),
  },
  {
    name: "the spec is missing",
    expectedMessagePart: `no ${specFileName} beside the plan`,
    problems: checkPlan(buildPlan({}), undefined, true),
  },
  ...proofCases.map(([name, proof, expectedMessagePart]) => ({
    name,
    expectedMessagePart,
    problems: checkAgainstProofSpec(
      buildPlan({
        proof,
      }),
    ),
  })),
  {
    name: "CRLF line endings",
    problems: checkAgainstProofSpec(buildPlan({}).replaceAll("\n", "\r\n")),
  },
  {
    name: "the spec has no numbered requirement",
    expectedMessagePart: "has no numbered requirement",
    problems: checkPlan(buildPlan({}), "## Requirements\n\nText.\n", true),
  },
  {
    name: "a spec whose subsections restart numbering needs each number once",
    problems: checkPlan(
      buildPlan({
        proof: "1, 2: proven.",
      }),
      "## Requirements\n\n### A\n\n1. A.\n2. B.\n\n### B\n\n1. C.\n2. D.\n",
      true,
    ),
  },
  {
    name: "a fix plan with no intent and no spec",
    problems: checkPlan(buildPlan({}), undefined, true, isFixPlanFolder(fixPlanFolder)),
  },
  {
    name: "a fix plan with an empty Proof",
    expectedMessagePart: "is empty",
    problems: checkPlan(
      buildPlan({
        proof: "",
      }),
      undefined,
      true,
      isFixPlanFolder(fixPlanFolder),
    ),
  },
  {
    name: "a fix plan whose Proof holds only a fenced block",
    problems: checkPlan(
      buildPlan({
        proof: "```\npnpm test\n```",
      }),
      undefined,
      true,
      isFixPlanFolder(fixPlanFolder),
    ),
  },
  {
    expectedMessagePart: acceptedByPrefix,
    name: "a fix plan with the placeholder engineer on a branch that changes code",
    problems: checkPlan(
      buildPlan({
        accepted: placeholderLine,
      }),
      undefined,
      requiresAcceptance(branchWithCode),
      isFixPlanFolder(fixPlanFolder),
    ),
  },
  {
    expectedMessagePart: headingsMessagePart,
    name: "a fix plan with a misspelled heading",
    problems: checkPlan(
      buildPlan({
        headings: requiredHeadings.map(heading => heading.replace("Risks", "Risk")),
      }),
      undefined,
      true,
      isFixPlanFolder(fixPlanFolder),
    ),
  },
  {
    name: "a folder with an intent and a plan but no spec is not a fix plan",
    expectedMessagePart: `no ${specFileName} beside the plan`,
    problems: checkPlan(buildPlan({}), undefined, true, isFixPlanFolder(intentOnlyFolder)),
  },
  {
    name: "a folder with a spec and a plan is not a fix plan",
    problems: checkPlan(buildPlan({}), proofSpec, true, isFixPlanFolder(specOnlyFolder)),
  },
  {
    name: "a missing default branch is reported",
    expectedMessagePart: "cannot be found",
    problems: [describeMissingDefaultBranch(undefined) ?? "no note"],
  },
  {
    name: "no note when the default branch is found",
    problems: describeMissingDefaultBranch(branchWithCode) === undefined ? [] : ["unexpected note"],
  },
  {
    name: "a done spec has no plan",
    expectedMessagePart: `no ${planFileName}`,
    problems: findMissingPlanProblems(doneSpec, false),
  },
  {
    name: "a done spec has a plan",
    problems: findMissingPlanProblems(doneSpec, true),
  },
  {
    name: "an accepted spec has no plan",
    problems: findMissingPlanProblems(proofSpec, false),
  },
  {
    name: "a branch with a code change requires acceptance",
    problems: requiresAcceptance(branchWithCode) ? [] : ["acceptance is not required"],
  },
  {
    name: "a branch that changes only intent files skips acceptance",
    problems: requiresAcceptance(intentBranch) ? [acceptanceRequiredProblem] : [],
  },
  {
    name: "no merge base skips acceptance",
    problems: requiresAcceptance(undefined) ? [acceptanceRequiredProblem] : [],
  },
  {
    name: "HEAD at the default branch tip skips acceptance",
    problems: requiresAcceptance({
      ...branchWithCode,
      headCommit: branchWithCode.mergeBase,
    })
      ? [acceptanceRequiredProblem]
      : [],
  },
  ...planOnlyCases.map(([name, title, branchName, expectedMessagePart]) => ({
    name,
    expectedMessagePart,
    problems: findPlanOnlyProblems(`# Plan: ${title}\n`, branchName),
  })),
  {
    name: "the branch comes from GITHUB_HEAD_REF when CI sets it",
    problems:
      readBranchName({
        [headReferenceVariable]: fixBranch,
      }) === fixBranch
        ? []
        : [fixBranch],
  },
  ...statusCases.map(([name, statusLine, isAdded, isPlanMerged, expectedMessagePart]) => ({
    name,
    expectedMessagePart,
    problems: findStatusProblems(readStatus(`${statusLine}\n`), isAdded, isPlanMerged),
  })),
  ...doneCases.map(([name, folder, branch, intent, spec, expectedMessagePart]) => ({
    name,
    expectedMessagePart,
    problems: isBuildPlan(folder, selfTestPlanPaths, requiresAcceptance(branch))
      ? findDoneProblems([
          [intentFileName, intent],
          [specFileName, spec],
        ])
      : [],
  })),
  {
    name: "a build branch with neither file done reports both",
    problems:
      findDoneProblems([
        [intentFileName, "accepted"],
        [specFileName, "accepted"],
      ]).length === 2
        ? []
        : ["expected one line for each file"],
  },
  ...(
    [
      [true, ["src/a.ts"]],
      [true, [loopSpecPath]],
      [true, [loopSpecPath, "intent/a/plan.md", "src/a.ts"]],
      [false, [loopSpecPath, "src/a.ts"]],
    ] as [boolean, string[]][]
  ).map(([needsNoPlan, changedPaths]) => ({
    expectedMessagePart: needsNoPlan ? undefined : "adds or changes no",
    name: `a branch changing ${changedPaths.join(", ")} ${needsNoPlan ? "needs no" : "needs a"} plan`,
    problems: findLoopPlanProblems(changedPaths),
  })),
  {
    expectedMessagePart: "fix the code, not the test",
    name: "a fix that edits a test the default branch holds",
    problems: findFixTestEditProblems(["src/a.test.ts", "src/a.ts"], "# Plan: a (fix)\n"),
  },
  {
    name: "a fix whose test change a code owner accepted",
    problems: findFixTestEditProblems(["test/a.ts"], "Test change accepted by: @owner.\n"),
  },
  {
    name: "a fix that edits only code",
    problems: findFixTestEditProblems(["src/a.ts"], "# Plan: a (fix)\n"),
  },
  {
    name: "every area of concern has a decision",
    problems: findDecisionProblems(
      `${concernsHeading}\n\n1. A.\n   ${decisionPrefix}yes.\n2. B.\n   ${decisionPrefix}no.\n\n## Open questions\n`,
    ),
  },
  {
    name: "a spec with no area of concern",
    problems: findDecisionProblems(`${concernsHeading}\n\nNone\n\n## Open questions\n`),
  },
  {
    name: "an area of concern has no decision",
    expectedMessagePart: "area of concern 2 has no",
    problems: findDecisionProblems(
      `${concernsHeading}\n\n1. A.\n   ${decisionPrefix}yes.\n2. B.\n\n## Open questions\n`,
    ),
  },
  {
    name: "a decision line with no text is not a decision",
    expectedMessagePart: "area of concern 1 has no",
    problems: findDecisionProblems(`${concernsHeading}\n\n1. A.\n   ${decisionPrefix}\n`),
  },
  {
    name: "an intent whose author is a handle",
    problems: findAuthorProblems("# Intent: A\n\nAuthor: @originator (Team). Status: draft.\n"),
  },
  {
    name: "an intent whose author is a name",
    expectedMessagePart: "holds no handle",
    problems: findAuthorProblems("# Intent: A\n\nAuthor: A Person (Team). Status: draft.\n"),
  },
];

/**
 * Tell whether a self-test case did not give the expected result.
 * @param testCase The self-test case.
 * @returns True when the case expects no message and got one, or expects exactly one message with its part and did not get it.
 */
function isSelfTestFailure(testCase: SelfTestCase): boolean {
  return testCase.expectedMessagePart === undefined
    ? testCase.problems.length > 0
    : testCase.problems.length !== 1 ||
        !testCase.problems.at(0)?.includes(testCase.expectedMessagePart);
}

const selfTestFailures = selfTestCases
  .filter(testCase => isSelfTestFailure(testCase))
  .map(({name}) => name);

for (const folder of [
  fixPlanFolder,
  intentOnlyFolder,
  specOnlyFolder,
  buildFolder,
  deletedPlanFolder,
]) {
  rmSync(folder, {
    recursive: true,
    force: true,
  });
}

/**
 * Read a file when it exists.
 * @param filePath Path of the file.
 * @returns The content, or undefined when the file does not exist.
 */
function readOptionalFile(filePath: string): string | undefined {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : undefined;
}

/**
 * List the intent folders of the working tree.
 * @returns The path of each `intent/<change>` folder, sorted.
 */
function listChangeFolders(): string[] {
  return existsSync(intentDirectory)
    ? readdirSync(intentDirectory, {
        withFileTypes: true,
      })
        .filter(entry => entry.isDirectory())
        .map(({name}) => path.join(intentDirectory, name))
        .toSorted((first, second) => first.localeCompare(second))
    : [];
}

/**
 * Report each done spec that has no plan.
 * @param changeFolders The `intent/<change>` folders.
 * @returns One line per problem.
 */
function findMissingPlanLines(changeFolders: string[]): string[] {
  return changeFolders
    .filter(folder => !existsSync(path.join(folder, planFileName)))
    .flatMap(folder =>
      findMissingPlanProblems(readOptionalFile(path.join(folder, specFileName)) ?? "", false).map(
        message => `${path.join(folder, planFileName)}: ${message}`,
      ),
    );
}

/**
 * Check one existing plan against the spec beside it.
 * @param planPath Path of the plan.
 * @param isAcceptanceRequired Whether the branch changes a file outside `intent/`.
 * @param branchName The branch under check, or undefined when the default branch is missing or already holds the plan, which may then change on any branch.
 * @returns One line per problem.
 */
function findPlanFileLines(
  planPath: string,
  isAcceptanceRequired: boolean,
  branchName?: string,
): string[] {
  const folder = path.dirname(planPath);
  const planText = readFileSync(planPath, "utf8");
  const isFixPlan = isFixPlanFolder(folder);
  const specText = readOptionalFile(path.join(folder, specFileName));
  const planOnly = isFixPlan && branchName !== undefined ? [branchName] : [];

  return [
    ...planOnly.flatMap(name => findPlanOnlyProblems(planText, name)),
    ...checkPlan(planText, specText, isAcceptanceRequired, isFixPlan),
  ].map(message => `${planPath}: ${message}`);
}

/**
 * Check each plan and report its problems.
 * @param planPaths The paths of the plans.
 * @returns One line per problem.
 */
function findPlanLines(planPaths: string[]): string[] {
  const branchChanges = planPaths.length > 0 ? findBranchChanges() : undefined;

  const missingBranchMessage =
    planPaths.length > 0 ? describeMissingDefaultBranch(branchChanges) : undefined;

  const missingBranchLines = missingBranchMessage === undefined ? [] : [missingBranchMessage];
  const isAcceptanceRequired = requiresAcceptance(branchChanges);

  const missingLines = planPaths
    .filter(planPath => !existsSync(planPath))
    .map(
      planPath =>
        `${planPath}: the file does not exist; pass the path of an existing ${planFileName}`,
    );

  const changedPlanPaths = planPaths
    .filter(planPath => existsSync(planPath))
    .filter(
      planPath =>
        branchChanges === undefined ||
        readDefaultBranchFile(branchChanges.mergeBase, planPath) !==
          readFileSync(planPath, "utf8").trim(),
    );

  const branchName = branchChanges === undefined ? undefined : readBranchName();

  const checkedLines = changedPlanPaths.flatMap(planPath =>
    findPlanFileLines(
      planPath,
      isAcceptanceRequired,
      isMergedFile(branchChanges, planPath) ? undefined : branchName,
    ),
  );

  return [...missingBranchLines, ...missingLines, ...checkedLines];
}

/**
 * Read a file as the default branch has it.
 * @param mergeBase The commit this branch left the default branch at.
 * @param filePath Path from the repository root.
 * @returns The content, or undefined when the default branch has no such file.
 */
function readDefaultBranchFile(mergeBase: string, filePath: string): string | undefined {
  try {
    return runGit(["show", `${mergeBase}:${filePath.split(path.sep).join("/")}`]);
  } catch {
    return undefined;
  }
}

/**
 * Tell whether the default branch already holds a file, which may then change or go on any branch.
 * @param changes What the branch changed, or undefined when the default branch is missing.
 * @param filePath Path of the file from the repository root.
 * @returns True when the commit where this branch left the default branch holds the file.
 */
function isMergedFile(changes: BranchChanges | undefined, filePath: string): boolean {
  return changes !== undefined && readDefaultBranchFile(changes.mergeBase, filePath) !== undefined;
}

/**
 * Report a branch in the SDLC loop that changes code with no plan, and a fix that edits a test the default branch holds.
 * @returns One line per problem.
 */
function findBranchRuleLines(): string[] {
  const branchChanges = findBranchChanges();

  if (branchChanges === undefined || branchChanges.mergeBase === branchChanges.headCommit) {
    return [];
  }

  const modifiedPaths = runGit([
    "diff",
    "--name-only",
    "--no-renames",
    "--diff-filter=MD",
    `${branchChanges.mergeBase}...HEAD`,
  ])
    .split("\n")
    .filter(modifiedPath => modifiedPath !== "");

  const fixPlanLines = branchChanges.changedPaths
    .filter(changedPath => planPathPattern.test(changedPath) && existsSync(changedPath))
    .filter(planPath => isFixPlanFolder(path.dirname(planPath)))
    .flatMap(planPath =>
      findFixTestEditProblems(modifiedPaths, readFileSync(planPath, "utf8")).map(
        message => `${planPath}: ${message}`,
      ),
    );

  return [...findLoopPlanProblems(branchChanges.changedPaths), ...fixPlanLines];
}

/**
 * Report each spec this branch adds or changes that leaves an area of concern undecided, and each intent it adds whose author is not a handle.
 * @param changeFolders The `intent/<change>` folders.
 * @returns One line per problem.
 */
function findRecordLines(changeFolders: string[]): string[] {
  const branchChanges = changeFolders.length > 0 ? findBranchChanges() : undefined;

  if (branchChanges === undefined) {
    return [];
  }

  return changeFolders.flatMap(folder => {
    const specPath = path.join(folder, specFileName);
    const intentPath = path.join(folder, intentFileName);
    const specText = readOptionalFile(specPath);

    const specProblems =
      specText === undefined ||
      readDefaultBranchFile(branchChanges.mergeBase, specPath) === specText.trim()
        ? []
        : findDecisionProblems(specText);

    const authorProblems =
      existsSync(intentPath) &&
      readDefaultBranchFile(branchChanges.mergeBase, intentPath) === undefined
        ? findAuthorProblems(readFileSync(intentPath, "utf8"))
        : [];

    return [
      ...specProblems.map(message => `${specPath}: ${message}`),
      ...authorProblems.map(message => `${intentPath}: ${message}`),
    ];
  });
}

/**
 * Report each intent and spec this branch adds or changes whose status would be wrong once it merges.
 * @param changeFolders The `intent/<change>` folders.
 * @returns One line per problem.
 */
function findStatusLines(changeFolders: string[]): string[] {
  if (changeFolders.length === 0) {
    return [];
  }

  const branchChanges = findBranchChanges();

  if (branchChanges === undefined) {
    return [];
  }

  const renamedPaths = new Set(
    runGit(["diff", "--name-status", "--find-renames", `${branchChanges.mergeBase}...HEAD`])
      .split("\n")
      .filter(line => line.startsWith("R"))
      .map(line => line.split("\t").at(-1) ?? ""),
  );

  return changeFolders
    .flatMap(folder => [intentFileName, specFileName].map(fileName => path.join(folder, fileName)))
    .filter(filePath => existsSync(filePath))
    .flatMap(filePath => {
      const text = readFileSync(filePath, "utf8");
      const defaultBranchText = readDefaultBranchFile(branchChanges.mergeBase, filePath);

      const isAdded =
        defaultBranchText === undefined && !renamedPaths.has(filePath.split(path.sep).join("/"));

      const planPath = path.join(path.dirname(filePath), planFileName);
      const isPlanMerged = readDefaultBranchFile(branchChanges.mergeBase, planPath) !== undefined;

      return defaultBranchText === text.trim()
        ? []
        : findStatusProblems(readStatus(text), isAdded, isPlanMerged).map(
            message => `${filePath}: ${message}`,
          );
    });
}

/**
 * Report each build plan that the branch adds and whose folder does not say done in its intent and spec.
 * @param changeFolders The `intent/<change>` folders.
 * @returns One line per problem.
 */
function findDoneLines(changeFolders: string[]): string[] {
  const branchChanges = changeFolders.length > 0 ? findBranchChanges() : undefined;
  const isCodeChanged = requiresAcceptance(branchChanges);

  return changeFolders
    .filter(folder => isBuildPlan(folder, branchChanges?.changedPaths ?? [], isCodeChanged))
    .filter(folder => !isMergedFile(branchChanges, path.join(folder, planFileName)))
    .flatMap(folder =>
      findDoneProblems(
        [intentFileName, specFileName].map((fileName): [string, string | undefined] => {
          const filePath = path.join(folder, fileName);

          return [filePath, readStatus(readOptionalFile(filePath) ?? "")];
        }),
      ),
    );
}

if (selfTestFailures.length > 0) {
  const failureLines = selfTestFailures.map(name => `- ${name}`);

  process.stderr.write(`Plan self-tests failed:\n${failureLines.join("\n")}\n`);
  process.exitCode = 1;
} else if (process.argv.includes("--self-test")) {
  process.stdout.write(`Ran ${selfTestCases.length} plan self-tests.\n`);
} else {
  const argumentPaths = process.argv.slice(2);
  const changeFolders = argumentPaths.length === 0 ? listChangeFolders() : [];

  const planPaths =
    argumentPaths.length === 0
      ? changeFolders
          .map(folder => path.join(folder, planFileName))
          .filter(planPath => existsSync(planPath))
      : argumentPaths;

  const problemLines = [
    ...findPlanLines(planPaths),
    ...findMissingPlanLines(changeFolders),
    ...findStatusLines(changeFolders),
    ...findRecordLines(changeFolders),
    ...(argumentPaths.length === 0
      ? [...findBranchRuleLines(), ...findDoneLines(changeFolders)]
      : []),
  ];

  if (problemLines.length > 0) {
    process.stderr.write(`${problemLines.join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(
      `Ran ${selfTestCases.length} plan self-tests and found no problem in ${planPaths.length} plans.\n`,
    );
  }
}
