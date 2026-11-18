import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {stripVTControlCharacters} from "node:util";

const thenFlag = "--then";
const selfTestFlag = "--self-test";
const runnerFileName = "run-checks.ts";
const runnerArgumentPattern = /^[\w:.-]+$/u;
const turborepoCachePattern = /^ *Cached: +\d+ cached, \d+ total$/gmu;

type Step = {
  isGated: boolean;
  name: string;
};

type StepResult = {
  exitCode: number;
  isCached: boolean;
};

type StepOutcome = {
  line: string;
  passed: boolean;
};

/**
 * Split the runner's arguments at `--then`.
 * @param argumentValues Script names, and at most one `--then` between them.
 * @returns The names before `--then`, which always run, and the names after it, which run only when every earlier step passed.
 */
function parseStepArguments(argumentValues: string[]): {after: string[]; before: string[]} {
  const thenIndex = argumentValues.indexOf(thenFlag);
  const before = thenIndex === -1 ? argumentValues : argumentValues.slice(0, thenIndex);
  const after = thenIndex === -1 ? [] : argumentValues.slice(thenIndex + 1);
  const unknownFlag = [...before, ...after].find(name => name.startsWith("--"));

  if (unknownFlag !== undefined || after.includes(thenFlag)) {
    throw new Error(
      `${unknownFlag ?? thenFlag} is not accepted here; write script names, and at most one ${thenFlag} before the scripts that need the earlier steps to pass.`,
    );
  }

  return {
    after,
    before,
  };
}

/**
 * Turn the names a runner call lists into the steps it runs, replacing a script whose own command is a call of this runner by that call's steps.
 * @param argumentValues The names after the runner's path, with an optional `--then`.
 * @param readCommand Gives the command of a package script, or undefined when there is none.
 * @param isGated True when the call itself runs only after every earlier step passed.
 * @param ancestors The scripts being expanded, to stop a script that calls itself.
 * @returns Each leaf step in order, with whether it waits for every earlier step to pass.
 */
function expandSteps(
  argumentValues: string[],
  readCommand: (name: string) => string | undefined,
  isGated: boolean,
  ancestors: string[],
): Step[] {
  const {after, before} = parseStepArguments(argumentValues);

  return [
    ...before.map((name): [string, boolean] => [name, isGated]),
    ...after.map((name): [string, boolean] => [name, true]),
  ].flatMap(([name, isStepGated]) => {
    const command = readCommand(name);

    if (command === undefined) {
      throw new Error(`package.json has no script "${name}"; name a script that exists.`);
    }

    if (ancestors.includes(name)) {
      throw new Error(
        `The script "${name}" runs itself (${[...ancestors, name].join(" -> ")}); remove the loop.`,
      );
    }

    const [program, programPath = "", ...nestedArguments] = command.split(" ");

    const isRunnerCall =
      program === "node" &&
      programPath.endsWith(runnerFileName) &&
      nestedArguments.length > 0 &&
      nestedArguments.every(argument => runnerArgumentPattern.test(argument));

    return isRunnerCall
      ? expandSteps(nestedArguments, readCommand, isStepGated, [...ancestors, name])
      : {
          isGated: isStepGated,
          name,
        };
  });
}

/**
 * Tell whether every Turborepo run in a step's output was answered from its cache.
 * @param output What the step printed.
 * @returns True when each of Turborepo's `Cached:` summary lines counts as many cached tasks as total ones; false when there is none, as for a step that is not a Turborepo run.
 */
function isAnsweredFromCache(output: string): boolean {
  const summaries = stripVTControlCharacters(output).match(turborepoCachePattern) ?? [];

  return (
    summaries.length > 0 &&
    summaries.every(summary => {
      const [cached, total] = summary.match(/\d+/gu) ?? [];

      return total !== "0" && cached === total;
    })
  );
}

/**
 * Write one line about a step.
 * @param step The step.
 * @param result What the step did, or undefined when it did not run.
 * @returns The line, and whether the step passed.
 */
function describeOutcome(step: Step, result: StepResult | undefined): StepOutcome {
  if (result === undefined) {
    return {
      passed: false,
      line: `${step.name}: skipped (an earlier step failed)`,
    };
  }

  const cacheNote = result.isCached ? ", answered from Turborepo's cache" : "";

  return result.exitCode === 0
    ? {
        passed: true,
        line: `${step.name}: passed${cacheNote}`,
      }
    : {
        passed: false,
        line: `${step.name}: failed (exit ${result.exitCode})${cacheNote}`,
      };
}

/**
 * Run the steps in order. A step that waits for the earlier ones is skipped once any earlier step has failed or been skipped.
 * @param steps The steps in order.
 * @param runStep Runs one step by name.
 * @returns One outcome for each step, in order.
 */
function runSteps(steps: Step[], runStep: (name: string) => StepResult): StepOutcome[] {
  const outcomes: StepOutcome[] = [];

  for (const step of steps) {
    const isBlocked = step.isGated && outcomes.some(({passed}) => !passed);

    outcomes.push(describeOutcome(step, isBlocked ? undefined : runStep(step.name)));
  }

  return outcomes;
}

/**
 * Run `pnpm run <name>`, and print its output when it ends.
 * @param name The package script's name.
 * @returns The exit code, and whether Turborepo answered every task from its cache.
 */
function runPackageScript(name: string): StepResult {
  const {error, status, stderr, stdout} = spawnSync("pnpm", ["run", name], {
    maxBuffer: Infinity,
    encoding: "utf8",
    stdio: ["inherit", "pipe", "pipe"],
  });

  if (error !== undefined) {
    throw error;
  }

  process.stdout.write(stdout);
  process.stderr.write(stderr);

  return {
    exitCode: status ?? 1,
    isCached: isAnsweredFromCache(stdout),
  };
}

const sampleCommands = new Map([
  ["a", "node scripts/run-checks.ts b c --then d"],
  ["b", "eslint ."],
  ["c", "turbo run test"],
  ["d", "tsc"],
  ["e", "node ./scripts/run-checks.ts a e"],
]);

/**
 * List the steps a sample runner call expands to.
 * @param argumentValues The runner's arguments.
 * @returns Each step's name, with a plus sign after a step that waits for the earlier ones to pass.
 */
function listSampleSteps(argumentValues: string[]): string[] {
  return expandSteps(argumentValues, name => sampleCommands.get(name), false, []).map(
    ({isGated, name}) => `${name}${isGated ? "+" : ""}`,
  );
}

/**
 * Tell what expanding steps throws, for a self-test.
 * @param argumentValues The runner's arguments.
 * @returns The message of the error, or an empty string when nothing is thrown.
 */
function findExpansionProblem(argumentValues: string[]): string {
  try {
    listSampleSteps(argumentValues);

    return "";
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

const sampleResults = new Map<string, StepResult>([
  [
    "b",
    {
      exitCode: 0,
      isCached: false,
    },
  ],
  [
    "c",
    {
      exitCode: 2,
      isCached: false,
    },
  ],
  [
    "d",
    {
      exitCode: 0,
      isCached: true,
    },
  ],
]);

const sampleOutcomes = runSteps(
  expandSteps(["a"], name => sampleCommands.get(name), false, []),
  name =>
    sampleResults.get(name) ?? {
      exitCode: 0,
      isCached: false,
    },
).map(({line}) => line);

const selfTestCases: [name: string, expected: string, actual: string][] = [
  ["names before and after --then", "b,c,d+", listSampleSteps(["b", "c", "--then", "d"]).join(",")],
  ["a runner call expands in place", "b,c,d+,b", listSampleSteps(["a", "b"]).join(",")],
  [
    "a step of a gated call stays gated",
    "b,b+,c+,d+",
    listSampleSteps(["b", "--then", "a"]).join(","),
  ],
  [
    "a script that runs itself",
    'The script "e" runs itself (e -> e); remove the loop.',
    findExpansionProblem(["e"]),
  ],
  [
    "a script that does not exist",
    'package.json has no script "z"; name a script that exists.',
    findExpansionProblem(["z"]),
  ],
  [
    "a failure keeps later steps and skips the gated one",
    "b: passed|c: failed (exit 2)|d: skipped (an earlier step failed)",
    sampleOutcomes.join("|"),
  ],
  [
    "every task cached",
    "true",
    String(isAnsweredFromCache("Tasks:    2 successful, 2 total\nCached:    2 cached, 2 total\n")),
  ],
  [
    "some tasks cached",
    "false",
    String(isAnsweredFromCache("Tasks:    2 successful, 2 total\nCached:    1 cached, 2 total\n")),
  ],
  ["no Turborepo run", "false", String(isAnsweredFromCache("All matched files use Prettier\n"))],
  [
    "a cached pass is marked",
    "build: passed, answered from Turborepo's cache",
    describeOutcome(
      {
        name: "build",
        isGated: false,
      },
      {
        exitCode: 0,
        isCached: true,
      },
    ).line,
  ],
];

const selfTestFailures = selfTestCases
  .filter(([, expected, actual]) => expected !== actual)
  .map(([name, expected, actual]) => `- ${name}: expected "${expected}", got "${actual}"`);

const argumentValues = process.argv.slice(2);

if (selfTestFailures.length > 0) {
  process.stderr.write(`Runner self-tests failed:\n${selfTestFailures.join("\n")}\n`);
  process.exitCode = 1;
} else if (argumentValues.includes(selfTestFlag)) {
  process.stdout.write(`Ran ${selfTestCases.length} runner self-tests.\n`);
} else {
  try {
    const manifest = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts?: Record<string, string>;
    };

    const steps = expandSteps(argumentValues, name => manifest.scripts?.[name], false, []);

    if (steps.length === 0) {
      throw new Error(
        `Name the package scripts to run, such as "node ${import.meta.filename} lint:check build".`,
      );
    }

    const outcomes = runSteps(steps, runPackageScript);

    process.stdout.write(`\nResults of ${steps.length} steps:\n`);

    for (const {line} of outcomes) {
      process.stdout.write(`${line}\n`);
    }

    process.exitCode = outcomes.every(({passed}) => passed) ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
