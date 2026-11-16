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
  readonly?: boolean;
  tools?: string[];
};

type HookConfig = {
  argument?: string;
  event: string;
  loopLimit?: number;
  matcher?: string;
  script: string;
  timeout?: number;
};

type HookCase = {
  argument?: string;
  changedFiles?: string[];
  committed?: boolean;
  expected: string;
  fileContents?: Record<string, string>;
  filesBeforeTurn?: string[];
  input: Record<string, unknown>;
  merged?: boolean;
  name: string;
  savedReply?: string;
  snapshotArgument?: string;
};

type ToolWords = {
  name: string;
  words: Record<string, string>;
};

type AgentTool = {
  agentFields: (agent: AgentConfig) => string[];
  agentsDirectory: string;
  hookFilePath: string;
  key: string;
  renderHookEntry: (hook: HookConfig) => Record<string, unknown>;
};

type HarnessSource = {
  agents: Map<string, AgentConfig & {body: string}>;
  hookScripts: Map<string, string>;
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
const hookConfigPath = path.join(adaptersRoot, "hooks.json");
const hooksDirectory = path.join(sourceRoot, "hooks");
const hookCasesSuffix = ".cases.json";
const hookTimeoutSeconds = 10;
const templateRoot = path.join("templates", "base");
const projectRoots = ["", templateRoot];
const sourceScriptsDirectory = path.join(sourceRoot, "scripts");
const templateScriptsDirectory = path.join(templateRoot, "scripts");
const projectSkillsDirectory = ".claude/skills";
const toolWordsDirectory = "sdlc-mode/tool-words";
const projectHooksDirectory = `${projectSkillsDirectory}/sdlc-mode/hooks`;
const pluginLoaderScript = path.join(templateRoot, ".cursor", "hooks", "load-project-plugins.sh");
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

/**
 * Find the subagent frontmatter fields Cursor reads.
 * @param agent Subagent configuration.
 * @returns The `readonly` field when the subagent sets it.
 */
function findCursorAgentFields(agent: AgentConfig): string[] {
  return agent.readonly === undefined ? [] : [`readonly: ${agent.readonly}`];
}

/**
 * Build the shell command that runs a hook script through `sh`.
 * @param scriptPath The script's path as the tool's shell resolves it, quoted where it holds a variable.
 * @param hook The hook that `hooks.json` names.
 * @returns The command, with the argument after the script when the hook has one.
 */
function renderHookCommand(scriptPath: string, hook: HookConfig): string {
  return ["sh", scriptPath, ...(hook.argument === undefined ? [] : [hook.argument])].join(" ");
}

/**
 * Render one hook as Claude Code reads it under an event, in a plugin's hook file or in a project's settings.
 * @param hook A hook that `hooks.json` names for Claude Code.
 * @param scriptPath The script's path as the shell resolves it.
 * @returns The entry, which runs the script through `sh`.
 */
function renderClaudeHookEntry(hook: HookConfig, scriptPath: string): Record<string, unknown> {
  return {
    ...(hook.matcher !== undefined && {
      matcher: hook.matcher,
    }),
    hooks: [
      {
        type: "command",
        timeout: hook.timeout ?? hookTimeoutSeconds,
        command: renderHookCommand(scriptPath, hook),
      },
    ],
  };
}

/**
 * Render one hook as Cursor reads it under an event of a project's hook file.
 * @param hook A hook that `hooks.json` names for Cursor.
 * @returns The entry, which runs the script through `sh` from the project root and caps the follow-ups of a `stop` hook.
 */
function renderCursorHookEntry(hook: HookConfig): Record<string, unknown> {
  return {
    command: renderHookCommand(`${projectHooksDirectory}/${hook.script}`, hook),
    ...(hook.loopLimit !== undefined && {
      loop_limit: hook.loopLimit,
    }),
  };
}

/**
 * Group hooks by event, in the order `hooks.json` lists them, so two scripts can share an event.
 * @param hooks The hooks that `hooks.json` names for one agent tool.
 * @param render Renders one hook as its tool expects it.
 * @returns Each event and its rendered hooks.
 */
function groupHooksByEvent(
  hooks: HookConfig[],
  render: (hook: HookConfig) => Record<string, unknown>,
): Record<string, Record<string, unknown>[]> {
  const grouped: Record<string, Record<string, unknown>[]> = {};

  for (const hook of hooks) {
    grouped[hook.event] = [...(grouped[hook.event] ?? []), render(hook)];
  }

  return grouped;
}

/**
 * Render one hook of the plugin that `claude plugin eval` loads.
 * @param hook A hook that `hooks.json` names for Claude Code.
 * @returns The entry, which runs the script from the plugin's `hooks` folder.
 */
function renderEvalPluginHookEntry(hook: HookConfig): Record<string, unknown> {
  return renderClaudeHookEntry(hook, `"\${CLAUDE_PLUGIN_ROOT}/hooks/${hook.script}"`);
}

/**
 * Render the hook file of the plugin that `claude plugin eval` loads, at `hooks/hooks.json`.
 * @param hooks The hooks that `hooks.json` names for Claude Code.
 * @returns The file content, with the hooks of each event in the order `hooks.json` lists them.
 */
function renderEvalPluginHooks(hooks: HookConfig[]): string {
  return `${JSON.stringify(
    {
      hooks: groupHooksByEvent(hooks, renderEvalPluginHookEntry),
    },
    undefined,
    2,
  )}\n`;
}

const agentTools: AgentTool[] = [
  {
    agentFields: findClaudeAgentFields,
    key: "claude-code",
    agentsDirectory: ".claude/agents",
    hookFilePath: ".claude/settings.json",
    renderHookEntry: hook =>
      renderClaudeHookEntry(hook, `"$CLAUDE_PROJECT_DIR"/${projectHooksDirectory}/${hook.script}`),
  },
  {
    agentFields: findCursorAgentFields,
    renderHookEntry: renderCursorHookEntry,
    key: "cursor",
    agentsDirectory: ".cursor/agents",
    hookFilePath: ".cursor/hooks.json",
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
 * Order the keys of every object in a JSON value, so that two values with the same content have the same text.
 * @param value A parsed JSON value.
 * @returns The value with each object's keys in order.
 */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => sortKeys(item));
  }

  return value !== null && typeof value === "object"
    ? Object.fromEntries(
        Object.entries(value)
          .toSorted(([first], [second]) => first.localeCompare(second))
          .map(([key, item]) => [key, sortKeys(item)]),
      )
    : value;
}

/**
 * Find the hook entries a protected file lacks, and the entries it holds for a harness script that `hooks.json` no longer runs that way. A person commits that file, so the script only reports.
 * @param filePath Path of the file from the repository root.
 * @param hooks The hooks that `hooks.json` names for the file's agent tool.
 * @param render Renders one hook as the file holds it under the hook's event.
 * @param fileText Content of the file; a missing file holds no entry.
 * @returns One message per hook whose entry is not under its event, then one per stale harness entry.
 */
function findHookEntryProblems(
  filePath: string,
  hooks: HookConfig[],
  render: (hook: HookConfig) => Record<string, unknown>,
  fileText = "{}",
): string[] {
  const {hooks: heldHooks = {}} = JSON.parse(fileText) as {
    hooks?: Record<string, unknown[]>;
  };

  const expected = hooks.map(hook => `${hook.event} ${JSON.stringify(sortKeys(render(hook)))}`);

  const held = Object.entries(heldHooks).flatMap(([event, entries]) =>
    entries.map(entry => `${event} ${JSON.stringify(sortKeys(entry))}`),
  );

  return [
    ...expected
      .filter(entry => !held.includes(entry))
      .map(entry => entry.split(" "))
      .map(
        ([event = "", ...entry]) =>
          `${filePath}: lacks the ${event} hook entry ${entry.join(" ")}; a person commits this file`,
      ),
    ...held
      .filter(entry => entry.includes(projectHooksDirectory) && !expected.includes(entry))
      .map(entry => entry.split(" "))
      .map(
        ([event = "", ...entry]) =>
          `${filePath}: holds the ${event} hook entry ${entry.join(" ")}, which the harness no longer has; a person removes it and commits this file`,
      ),
  ];
}

/**
 * Find what a protected file still holds of loading the harness as a plugin.
 * @param filePath Path of the file from the repository root.
 * @param fileText Content of the file; a missing file holds none of them.
 * @returns One message for each of `extraKnownMarketplaces`, `enabledPlugins`, and a `workspaceOpen` hook that the file holds.
 */
function findPluginLoaderKeys(filePath: string, fileText = "{}"): string[] {
  const {enabledPlugins, extraKnownMarketplaces, hooks} = JSON.parse(fileText) as {
    enabledPlugins?: unknown;
    extraKnownMarketplaces?: unknown;
    hooks?: {workspaceOpen?: unknown};
  };

  return [
    ...(extraKnownMarketplaces === undefined ? [] : ["extraKnownMarketplaces"]),
    ...(enabledPlugins === undefined ? [] : ["enabledPlugins"]),
    ...(hooks?.workspaceOpen === undefined ? [] : ["a workspaceOpen hook"]),
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
 * Create a Git repository with one commit that holds a source file, a plan, and an ignore rule for `coverage/`, for a hook case.
 * @param parentDirectory The directory to create the repository in.
 * @returns The repository's path.
 */
function createCaseRepository(parentDirectory: string): string {
  const repository = path.join(parentDirectory, "repository");

  mkdirSync(repository);

  execFileSync("git", ["init", "--quiet"], {
    cwd: repository,
    stdio: ["ignore", "ignore", "pipe"],
  });

  writeCaseFiles(repository, ["src/version.ts", "intent/app-version/plan.md"], "first\n");
  writeCaseFiles(repository, [".gitignore"], "coverage/\n");
  commitCaseFiles(repository);

  return repository;
}

/**
 * Run a hook script on one case in a private state directory.
 * @param script Path of the script from the repository root.
 * @param hookCase The case. A saved reply is stored first by the script's `save` argument. Changed files make the case run in a new Git repository: the script takes its snapshot, the files are written, and the case input gains the repository as `cwd` and `workspace_roots`. The snapshot is asked for with the argument the case names, or else with `submit` when the input holds `cursor_version`, or else with `snapshot`.
 * @returns The standard output of the script on the case input.
 */
function runHookCase(script: string, hookCase: HookCase): string {
  const stateDirectory = mkdtempSync(path.join(tmpdir(), "sdlc-hook-case-"));

  try {
    if (hookCase.savedReply !== undefined) {
      runHookScript(
        script,
        "save",
        {
          text: hookCase.savedReply,
          conversation_id: hookCase.input.conversation_id,
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

    const caseInput = {
      ...input,
      workspace_roots: [input.cwd],
    };

    writeCaseFiles(input.cwd, hookCase.filesBeforeTurn ?? [], "before\n");

    runHookScript(
      script,
      hookCase.snapshotArgument ??
        (hookCase.input.cursor_version === undefined ? "snapshot" : "submit"),
      caseInput,
      stateDirectory,
    );

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
 * @returns `pass` for no output, `block` for a block decision or a follow-up message, otherwise the output itself.
 */
function findHookOutcome(output: string): string {
  if (output.trim() === "") {
    return "pass";
  }

  try {
    const {
      decision,
      followup_message: followupMessage,
      hookSpecificOutput,
      permission,
    } = JSON.parse(output) as {
      decision?: string;
      followup_message?: string;
      hookSpecificOutput?: {permissionDecision?: string};
      permission?: string;
    };

    const isBlocked =
      decision === "block" ||
      followupMessage !== undefined ||
      permission === "deny" ||
      hookSpecificOutput?.permissionDecision === "deny";

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
 * Read the harness from the source: the skills with each agent tool's words, the hook scripts that `hooks.json` names, and the subagents.
 * @param hooksConfig The hooks that `hooks.json` names for each agent tool.
 * @returns The content of each skill file by its path under a skills folder, of each hook script by its name, and each subagent's configuration and body by its name.
 */
function readHarnessSource(hooksConfig: Record<string, HookConfig[]>): HarnessSource {
  const skillsDirectory = path.join(sourceRoot, "skills");
  const toolWords = JSON.parse(readFileSync(toolWordsPath, "utf8")) as Record<string, ToolWords>;

  const agentsConfig = JSON.parse(readFileSync(subagentConfigPath, "utf8")) as Record<
    string,
    AgentConfig
  >;

  const scripts = new Set(
    Object.values(hooksConfig).flatMap(hooks => hooks.map(hook => hook.script)),
  );

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
    hookScripts: new Map(
      [...scripts].map(script => [script, readFileSync(path.join(hooksDirectory, script), "utf8")]),
    ),
    skills: new Map([
      ...listFiles(skillsDirectory, false).map((file): [string, string] => [
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
 * Render the plugin that `claude plugin eval` loads: the manifest, the skills, the hooks in the plugin's own layout, and the subagents.
 * @param source The harness source.
 * @param hooks The hooks that `hooks.json` names for Claude Code.
 * @returns The expected content of each file of the plugin, by path from the repository root.
 */
function renderEvalPlugin(source: HarnessSource, hooks: HookConfig[]): [string, string][] {
  return [
    [evalPluginManifestPath, `${JSON.stringify(manifestFields, undefined, 2)}\n`],
    ...[...source.skills].map(([file, content]): [string, string] => [
      path.join(evalPluginRoot, "skills", file),
      content,
    ]),
    [path.join(evalPluginRoot, "hooks", "hooks.json"), renderEvalPluginHooks(hooks)],
    ...[...new Set(hooks.map(({script}) => script))].map((script): [string, string] => [
      path.join(evalPluginRoot, "hooks", script),
      source.hookScripts.get(script) ?? "",
    ]),
    ...renderAgents(path.join(evalPluginRoot, "agents"), source, findClaudeAgentFields),
  ];
}

/**
 * Render what a project holds of the harness, in the folders each agent tool reads from the repository: the skills with the hook scripts beside the front-door skill, and each tool's subagents.
 * @param projectRoot The project's folder from the repository root, empty for the repository itself.
 * @param source The harness source.
 * @returns The expected content of each file, by path from the repository root.
 */
function renderProject(projectRoot: string, source: HarnessSource): [string, string][] {
  return [
    ...[...source.skills].map(([file, content]): [string, string] => [
      path.join(projectRoot, projectSkillsDirectory, file),
      content,
    ]),
    ...[...source.hookScripts].map(([script, content]): [string, string] => [
      path.join(projectRoot, projectHooksDirectory, script),
      content,
    ]),
    ...agentTools.flatMap(({agentFields, agentsDirectory}) =>
      renderAgents(path.join(projectRoot, agentsDirectory), source, agentFields),
    ),
  ];
}

/**
 * Render the scripts a generated project runs its checks with.
 * @returns The expected content of each script under `templates/base/scripts/`, by path from the repository root.
 */
function renderTemplateScripts(): [string, string][] {
  return listFiles(sourceScriptsDirectory, false).map(file => [
    path.join(templateScriptsDirectory, file),
    readFileSync(path.join(sourceScriptsDirectory, file), "utf8"),
  ]);
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
        readonly: true,
        tools: ["Read"],
      },
    ],
  ]),
  hookScripts: new Map([["h.sh", "exit 0\n"]]),
  skills: new Map([[path.join("s", "SKILL.md"), "skill\n"]]),
};

const sampleHook: HookConfig = {
  event: "Stop",
  script: "h.sh",
};

const twoStopHooks: HookConfig[] = ["a.sh", "b.sh"].map(script => ({
  script,
  event: "Stop",
}));

const sampleHookEntry = '{"hooks":[{"command":"sh h.sh","type":"command"}]}';

/**
 * Render the sample hook the way a self-test's protected file holds it.
 * @returns The entry of `sampleHookEntry`, with its keys in another order.
 */
function renderSampleHookEntry(): Record<string, unknown> {
  return {
    hooks: [
      {
        type: "command",
        command: "sh h.sh",
      },
    ],
  };
}

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
 * Stand in for a hook script that blocks only when it gets the `followup` argument.
 * @param hookCase The hook case.
 * @returns A follow-up message when the case carries the `followup` argument, otherwise no output.
 */
function runArgumentStub(hookCase: HookCase): string {
  return hookCase.argument === "followup" ? '{"followup_message":"m"}' : "";
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
    name: "a project holds the skills, the hook scripts, and each tool's subagents",
    expected: [
      path.join("t", ".claude", "skills", "s", "SKILL.md"),
      path.join("t", ".claude", "skills", "sdlc-mode", "hooks", "h.sh"),
      path.join("t", ".claude", "agents", "a.md"),
      path.join("t", ".cursor", "agents", "a.md"),
      "---\nname: a\ndescription: d\ntools: Read\nmodel: haiku\n---\n\nbody",
      "---\nname: a\ndescription: d\nreadonly: true\n---\n\nbody",
    ],
    problems: (() => {
      const files = renderProject("t", sampleSource);

      return [...files.map(([file]) => file), ...files.slice(2).map(([, content]) => content)];
    })(),
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
    name: "a protected file that holds the hook entry passes, whatever the order of its keys",
    expected: [],
    problems: findHookEntryProblems(
      "f.json",
      [sampleHook],
      renderSampleHookEntry,
      `{"hooks": {"Stop": [{"hooks": [{"command": "other"}]}, ${sampleHookEntry}]}}`,
    ),
  },
  {
    name: "a protected file that holds the hook entry under another event, and a stale harness entry, fails",
    expected: [
      `f.json: lacks the Stop hook entry ${sampleHookEntry}; a person commits this file`,
      'f.json: holds the Stop hook entry {"hooks":[{"command":"sh .claude/skills/sdlc-mode/hooks/old.sh"}]}, which the harness no longer has; a person removes it and commits this file',
    ],
    problems: findHookEntryProblems(
      "f.json",
      [sampleHook],
      renderSampleHookEntry,
      `{"hooks": {"SessionStart": [${sampleHookEntry}], "Stop": [{"hooks": [{"command": "sh .claude/skills/sdlc-mode/hooks/old.sh"}]}]}}`,
    ),
  },
  {
    name: "a missing protected file lacks every hook entry",
    expected: [`f.json: lacks the Stop hook entry ${sampleHookEntry}; a person commits this file`],
    problems: findHookEntryProblems("f.json", [sampleHook], renderSampleHookEntry),
  },
  {
    name: "a protected file that still loads the harness as a plugin fails",
    expected: [
      "f.json: holds extraKnownMarketplaces, which loaded the harness as a plugin; a person removes it and commits this file",
      "f.json: holds enabledPlugins, which loaded the harness as a plugin; a person removes it and commits this file",
      "f.json: holds a workspaceOpen hook, which loaded the harness as a plugin; a person removes it and commits this file",
    ],
    problems: findPluginLoaderKeys(
      "f.json",
      '{"extraKnownMarketplaces": {}, "enabledPlugins": {}, "hooks": {"workspaceOpen": []}}',
    ),
  },
  {
    name: "a protected file with other keys and other hooks passes",
    expected: [],
    problems: findPluginLoaderKeys("f.json", '{"permissions": {}, "hooks": {"stop": []}}'),
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
          argument: "followup",
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
    name: "the eval plugin's hook file holds two hooks of one event, each run from the plugin's folder",
    expected: [
      `{"hooks":{"Stop":[${["a.sh", "b.sh"]
        .map(
          script =>
            `{"hooks":[{"type":"command","timeout":10,"command":"sh \\"\${CLAUDE_PLUGIN_ROOT}/hooks/${script}\\""}]}`,
        )
        .join(",")}]}}`,
    ],
    problems: [JSON.stringify(JSON.parse(renderEvalPluginHooks(twoStopHooks)))],
  },
  {
    name: "a hook renders for each tool's protected file with its argument, matcher, timeout, and loop limit",
    expected: [
      '{"matcher":"Bash","hooks":[{"type":"command","timeout":900,"command":"sh \\"$CLAUDE_PROJECT_DIR\\"/.claude/skills/sdlc-mode/hooks/h.sh snapshot"}]}',
      '{"command":"sh .claude/skills/sdlc-mode/hooks/h.sh followup","loop_limit":1}',
    ],
    problems: agentTools.map(({renderHookEntry}) =>
      JSON.stringify(
        renderHookEntry({
          event: "e",
          script: "h.sh",
          matcher: "Bash",
          loopLimit: 1,
          timeout: 900,
          argument: renderHookEntry === renderCursorHookEntry ? "followup" : "snapshot",
        }),
      ),
    ),
  },
  {
    name: "a subagent renders its tool's fields",
    expected: ["---\nname: a\ndescription: d\nreadonly: true\n---\n\nbody"],
    problems: [renderAgent("a", ["readonly: true"], subagent, "body")],
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

  const hooksConfig = JSON.parse(readFileSync(hookConfigPath, "utf8")) as Record<
    string,
    HookConfig[]
  >;

  const source = readHarnessSource(hooksConfig);

  const expected = new Map([
    ...renderEvalPlugin(source, hooksConfig["claude-code"] ?? []),
    ...projectRoots.flatMap(projectRoot => renderProject(projectRoot, source)),
    ...renderTemplateScripts(),
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
        .filter(([file]) => file.includes(`${path.sep}skills${path.sep}`))
        .flatMap(([file, content]) => [
          ...findMissingReferences(file, content, renderedFiles),
          ...findMissingPlaybooks(file, content, renderedFiles),
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
      ...projectRoots.flatMap(projectRoot =>
        agentTools.flatMap(({hookFilePath, key, renderHookEntry}) => {
          const file = path.join(projectRoot, hookFilePath);
          const text = readHeldFile(file);

          return [
            ...findHookEntryProblems(file, hooksConfig[key] ?? [], renderHookEntry, text),
            ...findPluginLoaderKeys(file, text),
          ];
        }),
      ),
      ...(existsSync(pluginLoaderScript)
        ? [`${pluginLoaderScript}: loaded the harness as a plugin; a person deletes this file`]
        : []),
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
