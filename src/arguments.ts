import {parseArgs} from "node:util";

import {defaultProjectName} from "./project-name.ts";
import {defaultStackId, isStackId, stacks} from "./stacks.ts";
import type {StackId} from "./stacks.ts";

export interface CliOptions {
  help: boolean;
  name?: string;
  skipGit: boolean;
  skipInstall: boolean;
  stack?: StackId;
  version: boolean;
  yes: boolean;
}

export const usage = `Usage: pnpm create @next-friday/app [name] [--stack ${stacks.map(stack => stack.id).join("|")}] [--yes]

  name            Project directory and package name, or . for the current directory. Asked when left out.
  --stack         Template stack. Asked when left out.
  -y, --yes       Ask nothing and take the defaults: the name ${defaultProjectName} and the stack ${defaultStackId}.
  --skip-git      Do not run git init.
  --skip-install  Do not run pnpm install.
  -v, --version   Show the version.
  -h, --help      Show this help.`;

/**
 * Parse the command-line arguments. Options left out are asked interactively.
 * @param cliArguments - Arguments after the executable and script path.
 * @returns The project name, stack, and flags.
 */
export function parseCliArguments(cliArguments: string[]): CliOptions {
  const {positionals, values} = parseArgs({
    args: cliArguments,
    allowPositionals: true,
    options: {
      stack: {
        type: "string",
      },
      "skip-git": {
        type: "boolean",
        default: false,
      },
      "skip-install": {
        type: "boolean",
        default: false,
      },
      version: {
        type: "boolean",
        short: "v",
        default: false,
      },
      help: {
        type: "boolean",
        short: "h",
        default: false,
      },
      yes: {
        type: "boolean",
        short: "y",
        default: false,
      },
    },
  });

  const {help, stack, version} = values;
  const isInformational = help || version;

  if (!isInformational && positionals.length > 1) {
    throw new Error(`Pass one project name, not ${positionals.length}: ${positionals.join(" ")}.`);
  }

  const [name] = positionals;

  if (!isInformational) {
    assertKnownStack(stack);
  }

  return {
    help,
    name,
    version,
    stack: stack !== undefined && isStackId(stack) ? stack : undefined,
    skipGit: values["skip-git"],
    skipInstall: values["skip-install"],
    yes: values.yes,
  };
}

/**
 * Throw when the stack is not one the CLI supports.
 * @param stack - Stack from the command line, or `undefined` when left out.
 */
function assertKnownStack(stack: string | undefined): void {
  if (stack === undefined || isStackId(stack)) {
    return;
  }

  const ids = stacks.map(supported => supported.id).join(", ");

  throw new Error(`Unknown stack "${stack}". Use one of: ${ids}.`);
}
