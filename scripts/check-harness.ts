import {execFileSync} from "node:child_process";
import {existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync} from "node:fs";
import path from "node:path";
import {tmpdir} from "node:os";

const configPath = ".agents/harness.json";
const generatorPackage = "@next-friday/app";

/**
 * List the files under a path, or the path itself when it is a file.
 * @param root Folder the path is relative to.
 * @param relativePath Path of a file or a folder, from the root, with forward slashes.
 * @returns Each file's path from the root, with forward slashes; none when the path does not exist.
 */
function listFiles(root: string, relativePath: string): string[] {
  const absolutePath = path.join(root, relativePath);

  if (!existsSync(absolutePath)) {
    return [];
  }

  return statSync(absolutePath).isDirectory()
    ? readdirSync(absolutePath).flatMap(name => listFiles(root, `${relativePath}/${name}`))
    : [relativePath];
}

/**
 * Tell whether the project declares that a harness file is its own.
 * @param filePath Path of the file from the project root, with forward slashes.
 * @param exceptions Paths of files and folders from `.agents/harness.json`.
 * @returns True when the path is an exception or lies in a folder that is one.
 */
function isException(filePath: string, exceptions: string[]): boolean {
  return exceptions.some(
    exception => filePath === exception || filePath.startsWith(`${exception.replace(/\/$/u, "")}/`),
  );
}

/**
 * Say how this project's copy of one harness file departs from the reference.
 * @param filePath Path of the file from the project root.
 * @param referenceText Content of the file in the reference project.
 * @param readProjectFile Reads this project's file at a path, or gives undefined when it is missing.
 * @returns A line when the file is missing or differs, otherwise undefined.
 */
function describeDifference(
  filePath: string,
  referenceText: string,
  readProjectFile: (filePath: string) => string | undefined,
): string | undefined {
  const projectText = readProjectFile(filePath);

  if (projectText === undefined) {
    return `${filePath}: is missing`;
  }

  return projectText === referenceText ? undefined : `${filePath}: differs`;
}

/**
 * Read a file of this project.
 * @param filePath Path of the file from the project root.
 * @returns The content, or undefined when the file does not exist.
 */
function readWorkingTreeFile(filePath: string): string | undefined {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : undefined;
}

/**
 * Compare the harness files of a reference project with this project's.
 * @param referenceFiles Content of each harness file of the reference project, by path.
 * @param readProjectFile Reads this project's file at a path, or gives undefined when it is missing.
 * @param exceptions Paths of files and folders the project declares as its own.
 * @returns One line per file that is missing or differs and is no exception.
 */
function findHarnessProblems(
  referenceFiles: Map<string, string>,
  readProjectFile: (filePath: string) => string | undefined,
  exceptions: string[],
): string[] {
  return [...referenceFiles]
    .filter(([filePath]) => !isException(filePath, exceptions))
    .map(([filePath, referenceText]) =>
      describeDifference(filePath, referenceText, readProjectFile),
    )
    .filter(line => line !== undefined);
}

/**
 * Generate the reference project of a version and read its harness files.
 * @param version Version of the generator, such as `10.1.0`.
 * @param stack Stack the project was generated with.
 * @param packageName Name in this project's `package.json`, so the rename changes nothing.
 * @param harnessPaths Files and folders of the harness, from `.agents/harness.json`.
 * @returns Content of each harness file of the reference project, by path.
 */
function readReferenceFiles(
  version: string,
  stack: string,
  packageName: string,
  harnessPaths: string[],
): Map<string, string> {
  const workDirectory = mkdtempSync(path.join(tmpdir(), "harness-check-"));

  try {
    execFileSync(
      "pnpm",
      [
        "create",
        `${generatorPackage}@${version}`,
        packageName,
        "--stack",
        stack,
        "--skip-install",
        "--skip-git",
      ],
      {
        cwd: workDirectory,
        stdio: ["ignore", "ignore", "inherit"],
      },
    );

    const referenceRoot = path.join(workDirectory, packageName);

    return new Map(
      harnessPaths
        .flatMap(harnessPath => listFiles(referenceRoot, harnessPath))
        .map(filePath => [filePath, readFileSync(path.join(referenceRoot, filePath), "utf8")]),
    );
  } finally {
    rmSync(workDirectory, {
      force: true,
      recursive: true,
    });
  }
}

const sampleReference = new Map([
  [".github/workflows/ci.yml", "ci\n"],
  ["AGENTS.md", "guide\n"],
  ["scripts/a.ts", "a\n"],
]);

const sampleProject = new Map([
  ["AGENTS.md", "guide of this project\n"],
  ["scripts/a.ts", "a\n"],
]);

const selfTestCases: [name: string, expected: string[], problems: string[]][] = [
  [
    "a missing file and a different file are reported",
    [".github/workflows/ci.yml: is missing", "AGENTS.md: differs"],
    findHarnessProblems(sampleReference, filePath => sampleProject.get(filePath), []),
  ],
  [
    "a declared file and a declared folder are not reported",
    [],
    findHarnessProblems(sampleReference, filePath => sampleProject.get(filePath), [
      "AGENTS.md",
      ".github/",
    ]),
  ],
];

const selfTestFailures = selfTestCases
  .filter(([, expected, problems]) => expected.join("\n") !== problems.join("\n"))
  .map(([name]) => `- ${name}`);

const version = process.argv.at(2);

if (selfTestFailures.length > 0) {
  process.stderr.write(`Harness self-tests failed:\n${selfTestFailures.join("\n")}\n`);
  process.exitCode = 1;
} else if (version === "--self-test") {
  process.stdout.write(`Ran ${selfTestCases.length} harness self-tests.\n`);
} else if (version === undefined || !existsSync(configPath)) {
  process.stderr.write(
    `Give the generator's version, such as "pnpm harness:check 10.1.0"; ${configPath} names the stack, the harness paths, and the files this project keeps as its own.\n`,
  );

  process.exitCode = 1;
} else {
  type HarnessConfig = {
    exceptions: string[];
    paths: string[];
    stack: string;
  };

  const config = JSON.parse(readFileSync(configPath, "utf8")) as HarnessConfig;
  const manifest = JSON.parse(readFileSync("package.json", "utf8")) as {name: string};
  const referenceFiles = readReferenceFiles(version, config.stack, manifest.name, config.paths);

  const problems = findHarnessProblems(referenceFiles, readWorkingTreeFile, [
    ...config.exceptions,
    configPath,
  ]);

  if (problems.length > 0) {
    process.stderr.write(
      `${problems.join("\n")}\n${problems.length} harness files do not match ${generatorPackage} ${version}; take each file from the reference, or name it in ${configPath}.\n`,
    );

    process.exitCode = 1;
  } else {
    process.stdout.write(
      `Checked ${referenceFiles.size} harness files against ${generatorPackage} ${version}; none differs.\n`,
    );
  }
}
