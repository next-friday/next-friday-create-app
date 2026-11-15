import {cancel, intro, isCancel, log, outro, select, text} from "@clack/prompts";
import {chmod, cp, readFile, rename, writeFile} from "node:fs/promises";
import {existsSync, readdirSync, readFileSync, realpathSync, rmSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";

import {
  bootstrapBranch,
  commitProject,
  didInstallDependencies,
  initGit,
  writeEnvironmentFile,
} from "./setup.ts";
import {defaultProjectName, packageName, validateProjectName} from "./project-name.ts";
import {defaultStackId, stackById, stacks, templateName} from "./stacks.ts";
import {listProjectFiles} from "./project-files.ts";
import {parseCliArguments, usage} from "./arguments.ts";
import {renameProject} from "./rename.ts";
import {resolveDeploySections} from "./deploy-sections.ts";
import type {CliOptions} from "./arguments.ts";
import type {CommitResult, GitResult} from "./setup.ts";
import type {DeployTarget} from "./deploy-targets.ts";
import type {StackId} from "./stacks.ts";

const templatesDirectory = fileURLToPath(new URL("../templates", import.meta.url));
const interruptSignals = ["SIGINT", "SIGTERM", "SIGHUP"] as const;
const commitLineLimit = 100;

type SetupResult = {
  commit: CommitResult | undefined;
  git: GitResult | undefined;
  isInstalled: boolean;
};

class CancelledError extends Error {
  override message = "Cancelled.";
}

/**
 * Copy the chosen template into a new project directory.
 * @param cliArguments - Arguments after the executable and script path.
 */
export async function create(cliArguments: string[]): Promise<void> {
  try {
    const cwd = process.cwd();
    const options = parseCliArguments(cliArguments);

    if (options.help) {
      process.stdout.write(`${usage}\n`);

      return;
    }

    if (options.version) {
      process.stdout.write(`${packageManifest().version}\n`);

      return;
    }

    const {name, stack} = await resolveProject(options, cwd);
    const manifestName = packageName(name, cwd);
    const target = path.resolve(cwd, name);
    const directory = existsSync(target) ? realpathSync(target) : target;

    log.step(`Copying the ${stack} template.`);
    await writeProject(stack, options.deploy, directory, manifestName);
    log.success(`Created ${manifestName} from the ${stack} template.`);

    const message = bootstrapMessage(name, stack, options.deploy);
    const {commit, git, isInstalled} = setUpProject(directory, options, message);

    outro(
      nextSteps(name, stack, {
        commit,
        git,
        isInstalled,
        message,
      }),
    );
  } catch (error) {
    if (error instanceof CancelledError) {
      cancel(error.message);
      process.exitCode = 130;
    } else {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    }
  }
}

/**
 * Copy, rename, and write `.env`, removing what was written when a step fails or Ctrl+C, SIGTERM, or SIGHUP arrives.
 * An interrupt waits for the running step, so the removal does not race the copy.
 * @param stack - Supported stack id.
 * @param deploy - Supported deploy target.
 * @param directory - Project directory.
 * @param manifestName - Package name for `package.json`.
 */
async function writeProject(
  stack: StackId,
  deploy: DeployTarget,
  directory: string,
  manifestName: string,
): Promise<void> {
  const kept = existsSync(directory) ? readdirSync(directory) : undefined;
  let isInterrupted = false;

  const interrupt = (): void => {
    isInterrupted = true;
  };

  for (const signal of interruptSignals) {
    process.on(signal, interrupt);
  }

  try {
    await copyTemplate(stack, deploy, directory);
    await renameProject(directory, templateName(stack), manifestName);
    await writeEnvironmentFile(directory);

    if (isInterrupted) {
      throw new CancelledError();
    }
  } catch (error) {
    removeProject(directory, kept);

    throw isInterrupted ? new CancelledError() : error;
  } finally {
    for (const signal of interruptSignals) {
      process.off(signal, interrupt);
    }
  }
}

/**
 * Take the project name and stack from the options, asking for any left out.
 * @param options - Parsed command-line options.
 * @param cwd - Directory the project is created in.
 * @returns A valid project name and the stack.
 */
async function resolveProject(
  options: CliOptions,
  cwd: string,
): Promise<{name: string; stack: StackId}> {
  if (options.yes) {
    return resolveDefaults(options, cwd);
  }

  if (!process.stdin.isTTY && (options.name === undefined || options.stack === undefined)) {
    throw new Error(`Pass the project name and --stack when not running in a terminal.\n${usage}`);
  }

  if (options.name !== undefined) {
    assertUsableName(options.name, cwd);
  }

  intro("Create a Next Friday project");

  const name = options.name ?? (await askName(cwd));
  const stack = options.stack ?? (await askStack());

  assertUsableName(name, cwd);

  return {
    name,
    stack,
  };
}

/**
 * Take the project name and stack from the options, and the defaults for any left out, without asking.
 * @param options - Parsed command-line options.
 * @param cwd - Directory the project is created in.
 * @returns A valid project name and the stack.
 */
function resolveDefaults(options: CliOptions, cwd: string): {name: string; stack: StackId} {
  const name = options.name ?? defaultProjectName;
  const nameError = validateProjectName(name, cwd);

  if (nameError !== undefined) {
    throw new Error(
      options.name === undefined ? `${nameError} Pass a project name with --yes.` : nameError,
    );
  }

  return {
    name,
    stack: options.stack ?? defaultStackId,
  };
}

/**
 * Throw when the project name is unusable or its directory is taken, as a prompt may have left a
 * directory in place since the name was checked.
 * @param name - Project name, or `.` for the current directory.
 * @param cwd - Directory the project is created in.
 */
function assertUsableName(name: string, cwd: string): void {
  const nameError = validateProjectName(name, cwd);

  if (nameError !== undefined) {
    throw new Error(nameError);
  }
}

const commitWarnings: Partial<Record<CommitResult, string>> = {
  failed: "The first commit failed. Fix the error above, then run the commit below.",
  "branch-taken": `The branch ${bootstrapBranch} exists. Switch to a new branch, then run the commit below.`,
};

const gitWarnings: Partial<Record<GitResult, string>> = {
  failed:
    "git init failed. Check that Git 2.28 or later is installed and the directory is writable, then run the steps below.",
  parent:
    "Skipped git init inside an existing Git repository. The Git hooks install only at a repository root.",
};

/**
 * Run `git init`, then `pnpm install`, so the install sets up the Git hooks, then make the first commit.
 * @param directory - Project directory.
 * @param options - Parsed command-line options.
 * @param message - Message of the first commit.
 * @returns The `git init` result, or `undefined` when skipped, whether the install succeeded, and the first commit's result, or `undefined` when no commit ran.
 */
function setUpProject(directory: string, options: CliOptions, message: string): SetupResult {
  const git = options.skipGit ? existingGit(directory) : initGit(directory);
  const warning = git === undefined ? undefined : gitWarnings[git];

  if (warning !== undefined) {
    log.warn(warning);
  }

  const isInstalled = !options.skipInstall && didInstallProject(directory);

  const canCommit =
    isInstalled && !options.skipGit && (git === "initialized" || git === "existing");

  return {
    git,
    isInstalled,
    commit: canCommit ? makeFirstCommit(directory, message) : undefined,
  };
}

/**
 * Run `pnpm install`, and report a failure with what to do.
 * @param directory - Project directory.
 * @returns Whether the install succeeded.
 */
function didInstallProject(directory: string): boolean {
  log.step("Installing dependencies with pnpm.");

  const isInstalled = didInstallDependencies(directory);

  if (!isInstalled) {
    log.error(
      "pnpm install failed. Fix the error above, then run the steps below. The project needs pnpm and the Node.js version in package.json#engines.",
    );

    process.exitCode = 1;
  }

  return isInstalled;
}

/**
 * Make the first commit, and warn when it did not happen.
 * @param directory - Project directory.
 * @param message - Message of the first commit.
 * @returns The first commit's result.
 */
function makeFirstCommit(directory: string, message: string): CommitResult {
  const commit = commitProject(directory, message);
  const warning = commitWarnings[commit];

  if (warning !== undefined) {
    log.warn(warning);
  }

  return commit;
}

/**
 * Report a repository that skipping `git init` leaves in place.
 * @param directory - Project directory.
 * @returns `existing` when the directory holds `.git`, otherwise `undefined`.
 */
function existingGit(directory: string): GitResult | undefined {
  return existsSync(path.join(directory, ".git")) ? "existing" : undefined;
}

/**
 * Copy the shared template files, the stack's files, and the deploy target's files into the project directory.
 * npm leaves `.gitignore` out of published packages, so the template keeps it as `_gitignore`.
 * @param stack - Supported stack id.
 * @param deploy - Supported deploy target.
 * @param directory - Project directory.
 */
async function copyTemplate(
  stack: StackId,
  deploy: DeployTarget,
  directory: string,
): Promise<void> {
  const deployLayer = deploy === "none" ? undefined : `deploy-${deploy}`;
  const required = ["base", stack, ...(deployLayer === undefined ? [] : [`${deployLayer}/base`])];

  for (const template of required) {
    if (!existsSync(path.join(templatesDirectory, template))) {
      throw new Error(
        `The ${template} template is missing from ${templatesDirectory}. Reinstall @next-friday/create-app.`,
      );
    }
  }

  const copyLayer = async (layer: string): Promise<void> => {
    await cp(path.join(templatesDirectory, layer), directory, {
      recursive: true,
    });
  };

  await copyLayer("base");
  await copyLayer(stack);

  if (deployLayer !== undefined) {
    await copyLayer(`${deployLayer}/base`);

    if (existsSync(path.join(templatesDirectory, deployLayer, stack))) {
      await copyLayer(`${deployLayer}/${stack}`);
    }
  }

  await rename(path.join(directory, "_gitignore"), path.join(directory, ".gitignore"));
  await resolveDeployTarget(directory, deploy);
  await markScriptsExecutable(directory);
}

/**
 * Resolve the deploy target sections of every copied file that holds a marker.
 * @param directory - Project directory.
 * @param deploy - Supported deploy target.
 */
async function resolveDeployTarget(directory: string, deploy: DeployTarget): Promise<void> {
  const files = await listProjectFiles(directory);

  await Promise.all(
    files.map(async file => {
      const content = await readFile(file);

      if (!content.includes("deploy:")) {
        return;
      }

      const template = content.toString();
      const resolved = resolveDeploySections(template, deploy);

      if (resolved !== template) {
        await writeFile(file, resolved);
      }
    }),
  );
}

/**
 * Make every file that starts with a shebang executable. `pnpm pack` drops the executable bit,
 * and the Git and agent hooks run these scripts directly.
 * @param directory - Project directory.
 */
async function markScriptsExecutable(directory: string): Promise<void> {
  const files = await listProjectFiles(directory);

  await Promise.all(
    files.map(async file => {
      const content = await readFile(file);

      if (content.subarray(0, 2).toString() === "#!") {
        await chmod(file, 0o755);
      }
    }),
  );
}

/**
 * Remove what this run wrote, leaving the target as it was before.
 * @param directory - Project directory.
 * @param kept - Entries the directory held before the run, or `undefined` when the run created it.
 */
function removeProject(directory: string, kept: string[] | undefined): void {
  const targets =
    kept === undefined
      ? [directory]
      : readdirSync(directory)
          .filter(entry => !kept.includes(entry))
          .map(entry => path.join(directory, entry));

  for (const target of targets) {
    rmSync(target, {
      force: true,
      recursive: true,
    });
  }
}

/**
 * Write the first commit's message: where the project came from, so `git blame` on an untouched file names the generator.
 * @param name - Project name, or `.` for the current directory.
 * @param stack - Supported stack id.
 * @param deploy - Supported deploy target.
 * @returns The commit message.
 */
function bootstrapMessage(name: string, stack: StackId, deploy: DeployTarget): string {
  const {name: packageId, version} = packageManifest();

  const commandParts = [
    `Command: pnpm create ${packageId.replace("/create-", "/")}`,
    name,
    `--stack ${stack} --deploy ${deploy}`,
  ];

  const commandLine = commandParts.join(" ");

  return [
    `build(repo): bootstrap ${stack} workspace`,
    "",
    `Generated by ${packageId} ${version}.`,
    "",
    commandLine.length <= commitLineLimit ? commandLine : commandParts.join(" \\\n  "),
    `Stack: ${stack} (${stackById[stack].hint})`,
    "",
  ].join("\n");
}

/**
 * List the commands left to run, skipping what the CLI already did.
 * @param name - Project name, or `.` for the current directory.
 * @param stack - Supported stack id.
 * @param setup - What the setup did, and the first commit's message.
 * @returns The next steps message.
 */
function nextSteps(name: string, stack: StackId, setup: SetupResult & {message: string}): string {
  const {commit, git, isInstalled, message} = setup;
  const {developmentScript, requiresDatabase} = stackById[stack];
  const hasGit = git !== undefined && git !== "failed";

  const commands = [
    name === "." ? [] : [`cd ${name}`],
    hasGit ? [] : ["git init --initial-branch=main"],
    hasGit && isInstalled ? [] : ["pnpm install"],
    commitCommands(commit, message),
    [`pnpm ${developmentScript}`],
  ].flat();

  const database = requiresDatabase
    ? `Set DATABASE_URL in .env to your PostgreSQL database before pnpm ${developmentScript}.\n`
    : "";

  const readme = name === "." ? "README.md" : `${name}/README.md`;
  const lines = commands.map(command => `  ${command}`).join("\n");

  return `Next steps:\n${lines}\n${database}${firstCommitNote(commit, message)}Then follow "After creating a project from this template" in ${readme}.`;
}

/**
 * List the commands that make the first commit, when the CLI did not make it.
 * @param commit - The first commit's result, or `undefined` when no commit ran.
 * @param message - Message of the first commit.
 * @returns `git add` and a `git commit` with one `-m` for each line of the message, or nothing after a commit.
 */
function commitCommands(commit: CommitResult | undefined, message: string): string[] {
  if (commit === "committed" || commit === "branched") {
    return [];
  }

  const messageOptions = message
    .split("\n")
    .filter(Boolean)
    .flatMap(line => ["-m", JSON.stringify(line)]);

  return ["git add --all", ["git commit", ...messageOptions].join(" ")];
}

/**
 * Say what the CLI's first commit leaves the person to do.
 * @param commit - The first commit's result, or `undefined` when no commit ran.
 * @param message - Message of the first commit, whose first line titles a pull request.
 * @returns A sentence that ends with a space, or nothing when the CLI made no commit.
 */
function firstCommitNote(commit: CommitResult | undefined, message: string): string {
  if (commit === "branched") {
    const subject = message.split("\n", 1).join("");

    return `Committed on the branch ${bootstrapBranch}. Push it and open a pull request titled "${subject}". `;
  }

  return commit === "committed" ? "Made the first commit on main. Push it. " : "";
}

/**
 * Read this package's name and version.
 * @returns The name and the version in `package.json`.
 */
function packageManifest(): {name: string; version: string} {
  return JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
    name: string;
    version: string;
  };
}

/**
 * Ask for the project name.
 * @param cwd - Directory the project is created in.
 * @returns A valid project name.
 */
async function askName(cwd: string): Promise<string> {
  const name = await text({
    placeholder: defaultProjectName,
    defaultValue: defaultProjectName,
    message: `What is the project called? It names the new directory and the package. Press Enter for ${defaultProjectName}.`,
    validate: (value = "") => validateProjectName(value === "" ? defaultProjectName : value, cwd),
  });

  if (isCancel(name)) {
    throw new CancelledError();
  }

  return name;
}

/**
 * Ask which stack to start from.
 * @returns The chosen stack id.
 */
async function askStack(): Promise<StackId> {
  const stack = await select<StackId>({
    initialValue: defaultStackId,
    message: `Which stack should the project start from? Press Enter for ${stackById[defaultStackId].label}.`,
    options: stacks.map(option => ({
      value: option.id,
      label: option.label,
      hint: option.hint,
    })),
  });

  if (isCancel(stack)) {
    throw new CancelledError();
  }

  return stack;
}
