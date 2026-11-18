import {execFileSync} from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {parse as parseYaml} from "yaml";
import path from "node:path";
import {tmpdir} from "node:os";

import {
  findEscapingReferences,
  findMissingPlaybooks,
  findMissingReferences,
  findVendorNames,
  findVersionKey,
  pluginRoot,
} from "./plugin-file-checks.ts";

type AgentConfig = {
  description: string;
  model?: string;
  tools?: string[];
};

type HookCase = {
  argument?: string;
  branchFiles?: Record<string, string>;
  changedFiles?: string[];
  committed?: boolean;
  expected: string;
  fileContents?: Record<string, string>;
  filesBeforeTurn?: string[];
  input: Record<string, unknown>;
  merged?: boolean;
  name: string;
  projectFolder?: string;
  transcript?: unknown[];
};

type ToolWords = {
  name: string;
  words: Record<string, string>;
};

type AgentTool = {
  agentFields: (agent: AgentConfig) => string[];
  agentsDirectory: string;
};

type HarnessSource = {
  agents: Map<string, AgentConfig & {body: string}>;
  skills: Map<string, string>;
};

type SelfTestCase = {
  expected: string[];
  name: string;
  problems: string[];
};

const sourceRoot = path.join(pluginRoot, "source");
const adaptersRoot = path.join(pluginRoot, "adapters");
const evalPluginRoot = path.join(adaptersRoot, "claude-code");
const evalPluginManifestPath = path.join(evalPluginRoot, ".claude-plugin", "plugin.json");
const evalCasesDirectory = path.join(evalPluginRoot, "evals");
const vendorNamesPath = path.join(adaptersRoot, "vendor-names.json");
const subagentConfigPath = path.join(adaptersRoot, "agents.json");
const toolWordsPath = path.join(adaptersRoot, "tool-words.json");
const hooksDirectory = path.join(sourceRoot, "skills", "sdlc-mode", "hooks");
const hookCasesSuffix = ".cases.json";
const templateRoot = path.join("templates", "base");
const projectRoots = ["", templateRoot];
const projectSkillsDirectory = ".claude/skills";
const projectSettingsPath = ".claude/settings.json";
const toolWordsDirectory = "sdlc-mode/tool-words";
const projectHooksDirectory = `${projectSkillsDirectory}/sdlc-mode/hooks`;
const hooksDirectoryWord = "{{hooks-directory}}";
const projectHooksReference = `\${CLAUDE_PROJECT_DIR}/${projectHooksDirectory}`;
const evalPluginHooksReference = `\${CLAUDE_PLUGIN_ROOT}/skills/sdlc-mode/hooks`;

const repositoryVariables = execFileSync("git", ["rev-parse", "--local-env-vars"], {
  encoding: "utf8",
})
  .trim()
  .split("\n");

// Git sets these in a hook, where they point every git command of a hook case at this repository instead of the case's own.
for (const name of repositoryVariables) {
  Reflect.deleteProperty(process.env, name);
}

const textExtensions = new Set([".json", ".md", ".sh", ".ts", ".yaml", ".yml"]);
const ignoredDirectories = new Set(["results"]);

const manifestFields = {
  name: "sdlc",
  description:
    "Runs the software development loop: a skill that matches a request to a playbook and takes it to the next human gate, a help skill, a verifier subagent, and the default policies.",
  license: "MIT",
  homepage: "https://github.com/next-friday/next-friday-create-app/tree/main/plugins/sdlc",
  repository: "https://github.com/next-friday/next-friday-create-app",
};

/**
 * Find the subagent frontmatter fields Claude Code reads.
 * @param agent Subagent configuration.
 * @returns The `tools` field when the subagent lists tools, then the `model` field when it sets a model.
 */
function findClaudeAgentFields(agent: AgentConfig): string[] {
  return [
    ...(agent.tools === undefined ? [] : [`tools: ${agent.tools.join(", ")}`]),
    ...(agent.model === undefined ? [] : [`model: ${agent.model}`]),
  ];
}

const agentTools: AgentTool[] = [
  {
    agentFields: findClaudeAgentFields,
    agentsDirectory: ".claude/agents",
  },
];

/**
 * List every text file under a directory, as paths relative to it.
 * @param directory Directory to read; a missing directory has no files.
 * @param shouldSkipResults Whether to skip the folders that tools write, such as `results`.
 * @returns Relative file paths.
 */
function listFiles(directory: string, shouldSkipResults: boolean): string[] {
  return existsSync(directory)
    ? readdirSync(directory, {
        recursive: true,
        withFileTypes: true,
      })
        .filter(entry => entry.isFile())
        .map(entry => path.relative(directory, path.join(entry.parentPath, entry.name)))
        .filter(
          file =>
            !shouldSkipResults ||
            file.split(path.sep).every(segment => !ignoredDirectories.has(segment)),
        )
    : [];
}

/**
 * Render a subagent with the frontmatter fields its tool reads.
 * @param name Subagent name.
 * @param fields Frontmatter fields after `name` and `description`.
 * @param agent Subagent configuration.
 * @param body Shared subagent body.
 * @returns The subagent file content.
 */
function renderAgent(name: string, fields: string[], agent: AgentConfig, body: string): string {
  return [
    `---`,
    `name: ${name}`,
    `description: ${agent.description}`,
    ...fields,
    `---`,
    ``,
    body,
  ].join("\n");
}

/**
 * Fill the word that names the hooks folder of the front-door skill with the path a target's skill file reaches it by.
 * @param content Content of a source skill file.
 * @param hooksReference The hooks folder's path as the target's hook command resolves it.
 * @returns The content with the word replaced.
 */
function fillHooksDirectory(content: string, hooksReference: string): string {
  return content.replaceAll(hooksDirectoryWord, () => hooksReference);
}

/**
 * Find a skill file whose frontmatter is not valid YAML: the agent tool then reads none of it, hooks included.
 * @param filePath The rendered file's path.
 * @param content The rendered file's content.
 * @returns At most one message.
 */
function findFrontmatterProblems(filePath: string, content: string): string[] {
  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(content)?.[1];

  if (frontmatter === undefined) {
    return [];
  }

  try {
    parseYaml(frontmatter);

    return [];
  } catch {
    return [`${filePath}: its frontmatter is not valid YAML`];
  }
}

/**
 * Find the hook entries a protected file holds for the front-door skill's hook scripts. The skill declares them in its own frontmatter, so a person removes them from the file and commits it; the script only reports.
 * @param filePath Path of the file from the repository root.
 * @param fileText Content of the file; a missing file holds no entry.
 * @returns One message for each hook entry whose command names the skill's hooks folder.
 */
function findSkillHookEntries(filePath: string, fileText = "{}"): string[] {
  const {hooks: heldHooks = {}} = JSON.parse(fileText) as {
    hooks?: Record<string, unknown[]>;
  };

  return Object.entries(heldHooks).flatMap(([event, entries]) =>
    entries
      .map(entry => JSON.stringify(entry))
      .filter(entry => entry.includes(projectHooksDirectory))
      .map(
        entry =>
          `${filePath}: holds the ${event} hook entry ${entry}, which the sdlc-mode skill declares in its frontmatter; a person removes it and commits this file`,
      ),
  );
}

/**
 * Find what a protected file still holds of loading the harness as a plugin.
 * @param filePath Path of the file from the repository root.
 * @param fileText Content of the file; a missing file holds none of them.
 * @returns One message for each of `extraKnownMarketplaces` and `enabledPlugins` that the file holds.
 */
function findPluginLoaderKeys(filePath: string, fileText = "{}"): string[] {
  const {enabledPlugins, extraKnownMarketplaces} = JSON.parse(fileText) as {
    enabledPlugins?: unknown;
    extraKnownMarketplaces?: unknown;
  };

  return [
    ...(extraKnownMarketplaces === undefined ? [] : ["extraKnownMarketplaces"]),
    ...(enabledPlugins === undefined ? [] : ["enabledPlugins"]),
  ].map(
    key =>
      `${filePath}: holds ${key}, which loaded the harness as a plugin; a person removes it and commits this file`,
  );
}

/**
 * Run a hook script on one input.
 * @param script Path of the script from the repository root.
 * @param argument The script's argument, if any.
 * @param input The hook input.
 * @param stateDirectory The temporary directory the script keeps its state in.
 * @returns The standard output, or a message when the script exits non-zero.
 */
function runHookScript(
  script: string,
  argument: string | undefined,
  input: Record<string, unknown>,
  stateDirectory: string,
): string {
  try {
    return execFileSync("sh", argument === undefined ? [script] : [script, argument], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        TMPDIR: stateDirectory,
      },
      input: JSON.stringify(input),
    });
  } catch {
    return "script failed";
  }
}

/**
 * Write the same content to each file of a hook case's repository.
 * @param repository The repository's path.
 * @param files Paths relative to the repository.
 * @param content The content of each file.
 */
function writeCaseFiles(repository: string, files: string[], content: string): void {
  for (const file of files) {
    mkdirSync(path.join(repository, path.dirname(file)), {
      recursive: true,
    });

    writeFileSync(path.join(repository, file), content);
  }
}

/**
 * Commit every file of a hook case's repository that Git does not ignore.
 * @param repository The repository's path.
 * @param isMerged Whether `origin/main` then points at the commit, as after a merge.
 */
function commitCaseFiles(repository: string, isMerged = false): void {
  for (const gitArguments of [
    ["add", "--all"],
    [
      "-c",
      "user.name=case",
      "-c",
      "user.email=case@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "--quiet",
      "--message",
      "case",
    ],
    ...(isMerged ? [["update-ref", "refs/remotes/origin/main", "HEAD"]] : []),
  ]) {
    execFileSync("git", gitArguments, {
      cwd: repository,
      stdio: ["ignore", "ignore", "pipe"],
    });
  }
}

/**
 * Create an empty Git repository for a hook case.
 * @param parentDirectory The directory to create the repository in.
 * @returns The repository's path.
 */
function initializeCaseRepository(parentDirectory: string): string {
  const repository = path.join(parentDirectory, "repository");

  mkdirSync(repository);

  execFileSync("git", ["init", "--quiet"], {
    cwd: repository,
    stdio: ["ignore", "ignore", "pipe"],
  });

  return repository;
}

/**
 * Create a Git repository with one commit that holds a source file, a plan, and an ignore rule for `coverage/`, for a hook case.
 * @param parentDirectory The directory to create the repository in.
 * @returns The repository's path.
 */
function createCaseRepository(parentDirectory: string): string {
  const repository = initializeCaseRepository(parentDirectory);

  writeCaseFiles(repository, ["src/version.ts", "intent/app-version/plan.md"], "first\n");
  writeCaseFiles(repository, [".gitignore"], "coverage/\n");
  commitCaseFiles(repository);

  return repository;
}

/**
 * Create a Git repository whose first commit holds a README and is `origin/main`, then commit files on a branch that leaves it.
 * @param parentDirectory The directory to create the repository in.
 * @param branchFiles The content of each file the branch commits, by path.
 * @returns The repository's path, on the branch.
 */
function createBranchCaseRepository(
  parentDirectory: string,
  branchFiles: Record<string, string>,
): string {
  const repository = initializeCaseRepository(parentDirectory);

  writeCaseFiles(repository, ["README.md"], "first\n");
  commitCaseFiles(repository, true);

  execFileSync("git", ["checkout", "--quiet", "-b", "case-branch"], {
    cwd: repository,
    stdio: ["ignore", "ignore", "pipe"],
  });

  for (const [file, content] of Object.entries(branchFiles)) {
    writeCaseFiles(repository, [file], content);
  }

  commitCaseFiles(repository);

  return repository;
}

/**
 * Write a case's transcript to a file, one entry on a line.
 * @param directory Directory that holds the case's state.
 * @param transcript Entries of the transcript, or nothing for a case that has none.
 * @returns The hook input field that names the file, or no field.
 */
function writeCaseTranscript(directory: string, transcript?: unknown[]): Record<string, string> {
  const file = path.join(directory, "transcript.jsonl");

  writeFileSync(file, (transcript ?? []).map(entry => `${JSON.stringify(entry)}\n`).join(""));

  return Object.fromEntries(transcript === undefined ? [] : [["transcript_path", file]]);
}

/**
 * Run a hook script on one case in a private state directory.
 * @param script Path of the script from the repository root.
 * @param hookCase The case. Branch files make the case run in a new Git repository, with the files committed on a branch that leaves `origin/main`, and the case input gains the repository as `cwd`. Changed files make the case run in a new Git repository: the script takes its snapshot with the `snapshot` argument, the files are written, and the case input gains the repository as `cwd`. A transcript is written to a file, one entry on a line, and the case input gains its path as `transcript_path`.
 * @returns The standard output of the script on the case input.
 */
function runHookCase(script: string, hookCase: HookCase): string {
  const stateDirectory = mkdtempSync(path.join(tmpdir(), "sdlc-hook-case-"));

  try {
    if (hookCase.branchFiles !== undefined) {
      return runHookScript(
        script,
        hookCase.argument,
        {
          ...hookCase.input,
          cwd: createBranchCaseRepository(stateDirectory, hookCase.branchFiles),
        },
        stateDirectory,
      );
    }

    if (hookCase.fileContents !== undefined) {
      const repository = createCaseRepository(stateDirectory);

      for (const [file, content] of Object.entries(hookCase.fileContents)) {
        writeCaseFiles(repository, [file], content);
      }

      return runHookScript(
        script,
        hookCase.argument,
        {
          ...hookCase.input,
          cwd: repository,
        },
        stateDirectory,
      );
    }

    if (hookCase.changedFiles === undefined) {
      return runHookScript(script, hookCase.argument, hookCase.input, stateDirectory);
    }

    const input = {
      ...hookCase.input,
      cwd: createCaseRepository(stateDirectory),
    };

    const project = path.join(input.cwd, hookCase.projectFolder ?? "");

    mkdirSync(project, {
      recursive: true,
    });

    const caseInput = {
      ...input,
      cwd: project,
      ...writeCaseTranscript(stateDirectory, hookCase.transcript),
    };

    writeCaseFiles(input.cwd, hookCase.filesBeforeTurn ?? [], "before\n");
    runHookScript(script, "snapshot", caseInput, stateDirectory);
    writeCaseFiles(input.cwd, hookCase.changedFiles, "changed\n");

    if (hookCase.committed === true) {
      commitCaseFiles(input.cwd, hookCase.merged);
    }

    return runHookScript(script, hookCase.argument, caseInput, stateDirectory);
  } finally {
    rmSync(stateDirectory, {
      force: true,
      recursive: true,
    });
  }
}

/**
 * Tell what a hook did from its standard output.
 * @param output Standard output of the hook script.
 * @returns `pass` for no output, `block` for a block decision, otherwise the output itself.
 */
function findHookOutcome(output: string): string {
  if (output.trim() === "") {
    return "pass";
  }

  try {
    const {decision, hookSpecificOutput} = JSON.parse(output) as {
      decision?: string;
      hookSpecificOutput?: {permissionDecision?: string};
    };

    const isBlocked = decision === "block" || hookSpecificOutput?.permissionDecision === "deny";

    return isBlocked ? "block" : output;
  } catch {
    return output;
  }
}

/**
 * Find the cases of a hook script whose outcome differs from the expected one.
 * @param script Path of the script from the repository root.
 * @param cases Hook cases with the expected outcome of each.
 * @param run Runs the script on one case and returns its standard output.
 * @returns One message per case that did not pass or block as expected.
 */
function findHookCaseProblems(
  script: string,
  cases: HookCase[],
  run: (hookCase: HookCase) => string,
): string[] {
  return cases
    .map(hookCase => ({
      expected: hookCase.expected,
      name: hookCase.name,
      outcome: findHookOutcome(run(hookCase)),
    }))
    .filter(({expected, outcome}) => outcome !== expected)
    .map(
      ({expected, name, outcome}) =>
        `${script}: case "${name}" expected ${expected}, got ${outcome}`,
    );
}

/**
 * Find the problems of one hook script.
 * @param script Path of the script from the repository root.
 * @returns A message when the script fails `sh -n`, has no case file, or has a case that fails.
 */
function findScriptProblems(script: string): string[] {
  const casesPath = path.join(
    path.dirname(script),
    `${path.basename(script, ".sh")}${hookCasesSuffix}`,
  );

  try {
    execFileSync("sh", ["-n", script], {
      stdio: "pipe",
    });
  } catch {
    return [`${script}: fails \`sh -n\``];
  }

  return existsSync(casesPath)
    ? findHookCaseProblems(
        script,
        JSON.parse(readFileSync(casesPath, "utf8")) as HookCase[],
        hookCase => runHookCase(script, hookCase),
      )
    : [`${casesPath}: is missing`];
}

/**
 * Find the problems of every hook script in the source.
 * @returns The problems of each script, in file order.
 */
function findHookProblems(): string[] {
  return listFiles(hooksDirectory, false)
    .filter(file => path.extname(file) === ".sh")
    .flatMap(file => findScriptProblems(path.join(hooksDirectory, file)));
}

/**
 * Render the file that holds one agent tool's words, which a skill names by their line.
 * @param toolWords The tool's display name and its words from `tool-words.json`.
 * @returns The file content: a heading that names the tool, then one list item for each word.
 */
function renderToolWordsFile(toolWords: ToolWords): string {
  return [
    `# ${toolWords.name}`,
    "",
    ...Object.entries(toolWords.words).map(([word, text]) => `- \`${word}\`: ${text}`),
    "",
  ].join("\n");
}

/**
 * Find tool words left in a rendered file. A skill names a word's line in the tool-words file of its agent tool.
 * @param filePath Path of the rendered file.
 * @param text Rendered text.
 * @returns One problem for each tool word left in the text.
 */
function findToolWords(filePath: string, text: string): string[] {
  return Array.from(
    text.matchAll(/\{\{[a-z]+(?:-[a-z]+)*\}\}/gu),
    ([word]) =>
      `${filePath}: holds the tool word ${word}; name its line of the tool-words file instead`,
  );
}

/**
 * Read the harness from the source: the skills, with their scripts and hook scripts, and each agent tool's words, and the subagents.
 * @returns The content of each skill file by its path under a skills folder, and each subagent's configuration and body by its name.
 */
function readHarnessSource(): HarnessSource {
  const skillsDirectory = path.join(sourceRoot, "skills");
  const toolWords = JSON.parse(readFileSync(toolWordsPath, "utf8")) as Record<string, ToolWords>;

  const agentsConfig = JSON.parse(readFileSync(subagentConfigPath, "utf8")) as Record<
    string,
    AgentConfig
  >;

  return {
    agents: new Map(
      Object.entries(agentsConfig).map(([name, agent]) => [
        name,
        {
          ...agent,
          body: readFileSync(path.join(sourceRoot, "agents", `${name}.md`), "utf8"),
        },
      ]),
    ),
    skills: new Map([
      ...listFiles(skillsDirectory, false)
        .filter(file => !file.endsWith(hookCasesSuffix))
        .map((file): [string, string] => [
          file,
          readFileSync(path.join(skillsDirectory, file), "utf8"),
        ]),
      ...Object.entries(toolWords).map(([tool, words]): [string, string] => [
        path.join(toolWordsDirectory, `${tool}.md`),
        renderToolWordsFile(words),
      ]),
    ]),
  };
}

/**
 * Render the subagents of one agent tool.
 * @param directory The folder that holds the subagents, from the repository root.
 * @param source The harness source.
 * @param agentFields Finds the frontmatter fields the agent tool reads.
 * @returns The expected content of each subagent file, by path from the repository root.
 */
function renderAgents(
  directory: string,
  source: HarnessSource,
  agentFields: (agent: AgentConfig) => string[],
): [string, string][] {
  return [...source.agents].map(([name, agent]) => [
    path.join(directory, `${name}.md`),
    renderAgent(name, agentFields(agent), agent, agent.body),
  ]);
}

/**
 * Render the plugin that `claude plugin eval` loads: the manifest, the skills, and the subagents.
 * @param source The harness source.
 * @returns The expected content of each file of the plugin, by path from the repository root.
 */
function renderEvalPlugin(source: HarnessSource): [string, string][] {
  return [
    [evalPluginManifestPath, `${JSON.stringify(manifestFields, undefined, 2)}\n`],
    ...[...source.skills].map(([file, content]): [string, string] => [
      path.join(evalPluginRoot, "skills", file),
      fillHooksDirectory(content, evalPluginHooksReference),
    ]),
    ...renderAgents(path.join(evalPluginRoot, "agents"), source, findClaudeAgentFields),
  ];
}

/**
 * Render what a project holds of the harness, in the folders each agent tool reads from the repository: the skills, with the hook scripts and the scripts inside the front-door skill, and the subagents.
 * @param projectRoot The project's folder from the repository root, empty for the repository itself.
 * @param source The harness source.
 * @returns The expected content of each file, by path from the repository root.
 */
function renderProject(projectRoot: string, source: HarnessSource): [string, string][] {
  return [
    ...[...source.skills].map(([file, content]): [string, string] => [
      path.join(projectRoot, projectSkillsDirectory, file),
      fillHooksDirectory(content, projectHooksReference),
    ]),
    ...agentTools.flatMap(({agentFields, agentsDirectory}) =>
      renderAgents(path.join(projectRoot, agentsDirectory), source, agentFields),
    ),
  ];
}

/**
 * List the folders that hold only rendered files.
 * @returns Each folder, from the repository root: the plugin that `claude plugin eval` loads, and each project's skills and subagents.
 */
function listRenderedDirectories(): string[] {
  return [
    evalPluginRoot,
    ...projectRoots.flatMap(projectRoot => [
      path.join(projectRoot, projectSkillsDirectory),
      ...agentTools.map(({agentsDirectory}) => path.join(projectRoot, agentsDirectory)),
    ]),
  ];
}

/**
 * Find the files that differ from what the source renders.
 * @param expected The expected content of each rendered file, by path.
 * @param heldFiles Path of each file the rendered folders hold.
 * @param read Reads a file, and returns undefined when there is none.
 * @returns Each expected file that is missing or holds other content, then each held file the source does not produce.
 */
function findStaleFiles(
  expected: Map<string, string>,
  heldFiles: string[],
  read: (file: string) => string | undefined,
): string[] {
  return [
    ...[...expected].filter(([file, content]) => read(file) !== content).map(([file]) => file),
    ...heldFiles.filter(file => !expected.has(file)),
  ];
}

/**
 * Read a file that may not be there.
 * @param file Path of the file from the repository root.
 * @returns The content, or undefined when there is no such file.
 */
function readHeldFile(file: string): string | undefined {
  return existsSync(file) ? readFileSync(file, "utf8") : undefined;
}

/**
 * Write each stale file as the source renders it, and remove the ones the source does not produce.
 * @param staleFiles The files `findStaleFiles` lists.
 * @param expected The expected content of each rendered file, by path.
 */
function writeRenderedFiles(staleFiles: string[], expected: Map<string, string>): void {
  for (const file of staleFiles) {
    const content = expected.get(file);

    if (content === undefined) {
      rmSync(file);
    } else {
      mkdirSync(path.dirname(file), {
        recursive: true,
      });

      writeFileSync(file, content);
    }
  }
}

const subagent: AgentConfig = {
  description: "d",
};

const versionProblem = "m.json: holds a version key";

const sampleSource: HarnessSource = {
  agents: new Map([
    [
      "a",
      {
        ...subagent,
        body: "body",
        model: "haiku",
        tools: ["Read"],
      },
    ],
  ]),
  skills: new Map([[path.join("s", "SKILL.md"), `skill ${hooksDirectoryWord}\n`]]),
};

const sampleHookEntry =
  '{"hooks":[{"command":"sh \\"$CLAUDE_PROJECT_DIR\\"/.claude/skills/sdlc-mode/hooks/h.sh","type":"command"}]}';

const blockingOutput = '{"decision":"block"}';

const hookCases: HookCase[] = [
  {
    name: "a",
    expected: "pass",
    input: {
      blocks: false,
    },
  },
  {
    name: "b",
    expected: "block",
    input: {
      blocks: true,
    },
  },
];

/**
 * Stand in for a hook script that blocks the inputs that say so.
 * @param hookCase The hook case.
 * @returns A block decision when the input blocks, otherwise no output.
 */
function runBlockingStub(hookCase: HookCase): string {
  return hookCase.input.blocks === true ? blockingOutput : "";
}

/**
 * Stand in for a hook script that blocks the inputs that do not say so.
 * @param hookCase The hook case.
 * @returns A block decision when the input does not block, otherwise no output.
 */
function runInvertedStub(hookCase: HookCase): string {
  return runBlockingStub(hookCase) === "" ? blockingOutput : "";
}

/**
 * Stand in for a hook script that blocks only when it gets the `snapshot` argument.
 * @param hookCase The hook case.
 * @returns A block decision when the case carries the `snapshot` argument, otherwise no output.
 */
function runArgumentStub(hookCase: HookCase): string {
  return hookCase.argument === "snapshot" ? blockingOutput : "";
}

const selfTestCases: SelfTestCase[] = [
  {
    name: "a link into the plugin passes",
    expected: [],
    problems: findEscapingReferences(
      path.join(pluginRoot, "source/skills/sdlc-mode/SKILL.md"),
      "[a](playbooks/build.md) and `../../brand-policy/SKILL.md` and [b](https://example.com/../x)",
    ),
  },
  {
    name: "a link above the plugin fails",
    expected: [`${path.join(pluginRoot, "source/a.md")}: ../../../AGENTS.md leaves ${pluginRoot}/`],
    problems: findEscapingReferences(
      path.join(pluginRoot, "source/a.md"),
      "[x](../../../AGENTS.md)",
    ),
  },
  {
    name: "an import above the plugin fails",
    expected: [
      `${path.join(pluginRoot, "source/scripts/a.ts")}: ../../../../scripts/b.ts leaves ${pluginRoot}/`,
    ],
    problems: findEscapingReferences(
      path.join(pluginRoot, "source/scripts/a.ts"),
      'import "../../../../scripts/b.ts";',
    ),
  },
  {
    name: "an absolute link fails",
    expected: [`${path.join(pluginRoot, "a.md")}: /etc/passwd leaves ${pluginRoot}/`],
    problems: findEscapingReferences(path.join(pluginRoot, "a.md"), "[x](/etc/passwd)"),
  },
  {
    name: "a reference to a rendered file or to a folder that holds one passes",
    expected: [],
    problems: findMissingReferences(
      path.join("p", "skills", "a", "SKILL.md"),
      "[b](playbooks/b.md), `../c/` and `../..`, and [d](https://example.com/x)",
      [
        path.join("p", "skills", "a", "playbooks", "b.md"),
        path.join("p", "skills", "c", "SKILL.md"),
      ],
    ),
  },
  {
    name: "a playbook path that the skill's own folder does not hold fails",
    expected: [
      `${path.join("p", "skills", "a", "SKILL.md")}: playbooks/b.md names no rendered file`,
    ],
    problems: findMissingPlaybooks(
      path.join("p", "skills", "a", "SKILL.md"),
      "see `playbooks/b.md`",
      [path.join("p", "skills", "c", "playbooks", "b.md")],
    ),
  },
  {
    name: "a reference to a file the source does not render fails",
    expected: [
      `${path.join("p", "skills", "a", "SKILL.md")}: ../c/SKILL.md names no rendered file`,
    ],
    problems: findMissingReferences(
      path.join("p", "skills", "a", "SKILL.md"),
      "see `../c/SKILL.md`",
      [path.join("p", "skills", "a", "SKILL.md")],
    ),
  },
  {
    name: "an agent tool's words render under a heading that names the tool",
    expected: ["# Tool\n\n- `rules-file`: `~/rules`\n- `model-switch`: the picker\n"],
    problems: [
      renderToolWordsFile({
        name: "Tool",
        words: {
          "rules-file": "`~/rules`",
          "model-switch": "the picker",
        },
      }),
    ],
  },
  {
    name: "a tool word left in a rendered file fails",
    expected: [
      "a.md: holds the tool word {{model-switch}}; name its line of the tool-words file instead",
    ],
    problems: findToolWords("a.md", "use {{model-switch}}"),
  },
  {
    name: "a project holds the skills with the hooks folder filled in, and the subagents",
    expected: [
      path.join("t", ".claude", "skills", "s", "SKILL.md"),
      `skill ${projectHooksReference}\n`,
      path.join("t", ".claude", "agents", "a.md"),
      "---\nname: a\ndescription: d\ntools: Read\nmodel: haiku\n---\n\nbody",
    ],
    problems: renderProject("t", sampleSource).flat(),
  },
  {
    name: "a rendered file with other content, a missing one, and an extra one are stale",
    expected: ["b.md", "c.md", "d.md"],
    problems: findStaleFiles(
      new Map([
        ["a.md", "a"],
        ["b.md", "b"],
        ["c.md", "c"],
      ]),
      ["a.md", "b.md", "d.md"],
      file =>
        ({
          "a.md": "a",
          "b.md": "edited",
          "d.md": "d",
        })[file],
    ),
  },
  {
    name: "a protected file that holds a hook entry for the skill's hook scripts fails, and other hooks pass",
    expected: [
      `f.json: holds the Stop hook entry ${sampleHookEntry}, which the sdlc-mode skill declares in its frontmatter; a person removes it and commits this file`,
    ],
    problems: findSkillHookEntries(
      "f.json",
      `{"hooks": {"Stop": [{"hooks": [{"command": "other"}]}, ${sampleHookEntry}]}}`,
    ),
  },
  {
    name: "a missing protected file holds no hook entry",
    expected: [],
    problems: findSkillHookEntries("f.json"),
  },
  {
    name: "a protected file that still loads the harness as a plugin fails",
    expected: [
      "f.json: holds extraKnownMarketplaces, which loaded the harness as a plugin; a person removes it and commits this file",
      "f.json: holds enabledPlugins, which loaded the harness as a plugin; a person removes it and commits this file",
    ],
    problems: findPluginLoaderKeys(
      "f.json",
      '{"extraKnownMarketplaces": {}, "enabledPlugins": {}}',
    ),
  },
  {
    name: "a protected file with other keys and other hooks passes",
    expected: [],
    problems: findPluginLoaderKeys("f.json", '{"permissions": {}, "hooks": {"stop": []}}'),
  },
  {
    name: "a frontmatter with a double quote inside a double-quoted value fails",
    expected: ["a.md: its frontmatter is not valid YAML"],
    problems: findFrontmatterProblems("a.md", '---\ncommand: "sh "$A"/b.sh"\n---\n'),
  },
  {
    name: "a frontmatter with a double quote inside a single-quoted value passes",
    expected: [],
    problems: findFrontmatterProblems("a.md", "---\ncommand: 'sh \"$A\"/b.sh'\n---\n"),
  },
  {
    name: "a listed name fails in any case and an unlisted one passes",
    expected: ['a.md: names "Cursor"'],
    problems: findVendorNames("a.md", "CURSOR and others", ["Cursor", "Other"]),
  },
  {
    name: "a listed name inside a longer word passes",
    expected: [],
    problems: findVendorNames("a.md", "cursors and precursor", ["Cursor"]),
  },
  {
    name: "a manifest with a version fails",
    expected: [versionProblem],
    problems: findVersionKey("m.json", '{"name": "sample", "version": "1.0.0"}'),
  },
  {
    name: "a manifest without a version passes",
    expected: [],
    problems: findVersionKey("m.json", '{"name": "sample"}'),
  },
  {
    name: "a hook case that passes or blocks as expected passes",
    expected: [],
    problems: findHookCaseProblems("h.sh", hookCases, runBlockingStub),
  },
  {
    name: "a hook case with the other outcome fails",
    expected: [
      'h.sh: case "a" expected pass, got block',
      'h.sh: case "b" expected block, got pass',
    ],
    problems: findHookCaseProblems("h.sh", hookCases, runInvertedStub),
  },
  {
    name: "a hook that prints anything but a block decision fails",
    expected: ['h.sh: case "a" expected pass, got oops'],
    problems: findHookCaseProblems("h.sh", hookCases.slice(0, 1), () => "oops"),
  },
  {
    name: "a hook case hands its argument to the runner",
    expected: [],
    problems: findHookCaseProblems(
      "h.sh",
      [
        {
          name: "a",
          expected: "block",
          argument: "snapshot",
          input: {},
        },
        {
          name: "b",
          expected: "pass",
          input: {},
        },
      ],
      runArgumentStub,
    ),
  },
  {
    name: "a subagent renders its tool's fields",
    expected: ["---\nname: a\ndescription: d\nmodel: haiku\n---\n\nbody"],
    problems: [renderAgent("a", ["model: haiku"], subagent, "body")],
  },
];

const selfTestFailures = selfTestCases
  .filter(({expected, problems}) => JSON.stringify(expected) !== JSON.stringify(problems))
  .map(({name}) => name);

if (selfTestFailures.length > 0) {
  const failureLines = selfTestFailures.map(name => `- ${name}`);

  process.stderr.write(`Plugin sync self-tests failed:\n${failureLines.join("\n")}\n`);
  process.exitCode = 1;
} else {
  const isCheckOnly = process.argv.includes("--check");
  const source = readHarnessSource();

  const expected = new Map([
    ...renderEvalPlugin(source),
    ...projectRoots.flatMap(projectRoot => renderProject(projectRoot, source)),
  ]);

  const staleFiles = findStaleFiles(
    expected,
    listRenderedDirectories()
      .flatMap(directory => listFiles(directory, false).map(file => path.join(directory, file)))
      .filter(file => !file.startsWith(`${evalCasesDirectory}${path.sep}`)),
    readHeldFile,
  );

  if (isCheckOnly) {
    const vendorNames = JSON.parse(readFileSync(vendorNamesPath, "utf8")) as string[];
    const renderedFiles = [...expected].map(([file]) => file);

    const problems = [
      ...staleFiles.map(file => `${file}: is stale; run \`pnpm plugin:sync\``),
      ...[...expected].flatMap(([file, content]) => findToolWords(file, content)),
      ...[...expected]
        .filter(
          ([file]) => file.includes(`${path.sep}skills${path.sep}`) && path.extname(file) === ".md",
        )
        .flatMap(([file, content]) => [
          ...findMissingReferences(file, content, renderedFiles),
          ...findMissingPlaybooks(file, content, renderedFiles),
          ...findFrontmatterProblems(file, content),
        ]),
      ...listFiles(pluginRoot, true)
        .filter(file => textExtensions.has(path.extname(file)))
        .map(file => path.join(pluginRoot, file))
        .flatMap(file => findEscapingReferences(file, readFileSync(file, "utf8"))),
      ...listFiles(sourceRoot, true)
        .map(file => path.join(sourceRoot, file))
        .flatMap(file => findVendorNames(file, readFileSync(file, "utf8"), vendorNames)),
      ...findHookProblems(),
      ...findVersionKey(evalPluginManifestPath, expected.get(evalPluginManifestPath) ?? "{}"),
      ...projectRoots.flatMap(projectRoot => {
        const file = path.join(projectRoot, projectSettingsPath);
        const text = readHeldFile(file);

        return [...findSkillHookEntries(file, text), ...findPluginLoaderKeys(file, text)];
      }),
    ];

    if (problems.length > 0) {
      process.stderr.write(`${problems.join("\n")}\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write(
        `Checked ${expected.size} plugin files and ${selfTestCases.length} self-tests; none stale.\n`,
      );
    }
  } else {
    writeRenderedFiles(staleFiles, expected);
    process.stdout.write(`Synced ${expected.size} plugin files; ${staleFiles.length} updated.\n`);
  }
}
