import path from "node:path";

export const pluginRoot = "plugins/sdlc";

const referencePattern = /\]\(([^\s)]+)\)|(?<![\w./-])(\.\.?\/[^\s"'<>)\]`]*)/g;
const urlScheme = /^[a-z][\d+.a-z-]*:/i;

/**
 * Find the references in a file that resolve outside the plugin directory.
 * @param filePath Path of the file from the repository root.
 * @param text File content.
 * @returns One message per reference that leaves the plugin directory.
 */
export function findEscapingReferences(filePath: string, text: string): string[] {
  return listReferences(text)
    .filter(target => isEscapingReference(filePath, target))
    .map(target => `${filePath}: ${target} leaves ${pluginRoot}/`);
}

/**
 * Find the references in a rendered file that name no rendered file.
 * @param filePath Path of the rendered file from the repository root.
 * @param text File content.
 * @param renderedFiles Path of every rendered file, from the repository root.
 * @returns One message per reference that is neither a rendered file nor a folder that holds one.
 */
export function findMissingReferences(
  filePath: string,
  text: string,
  renderedFiles: string[],
): string[] {
  const renderedPaths = renderedFiles.map(file => path.resolve(file));

  return listReferences(text)
    .filter(target => {
      const resolved = path.resolve(path.dirname(filePath), target.split("#", 1)[0] ?? "");

      return renderedPaths.every(
        file => !(file === resolved || file.startsWith(`${resolved}${path.sep}`)),
      );
    })
    .map(target => `${filePath}: ${target} names no rendered file`);
}

const playbookPathPattern = /`(playbooks\/[\w-]+\.md)`/g;

/**
 * Find the playbook paths a skill's own file writes with no folder before them and that name no rendered file.
 * @param filePath Path of the rendered file from the repository root.
 * @param text File content.
 * @param renderedFiles Path of every rendered file, from the repository root.
 * @returns One message per path that the skill's own folder does not hold; a playbook names its siblings this way, so a file in `playbooks/` gives none.
 */
export function findMissingPlaybooks(
  filePath: string,
  text: string,
  renderedFiles: string[],
): string[] {
  if (path.basename(path.dirname(filePath)) === "playbooks") {
    return [];
  }

  const renderedPaths = new Set(renderedFiles.map(file => path.resolve(file)));

  return Array.from(text.matchAll(playbookPathPattern), match => match[1] ?? "")
    .filter(target => !renderedPaths.has(path.resolve(path.dirname(filePath), target)))
    .map(target => `${filePath}: ${target} names no rendered file`);
}

/**
 * Find the names a file must not contain.
 * @param filePath Path of the file from the repository root.
 * @param text File content.
 * @param names Agent tool names from `vendor-names.json`.
 * @returns One message per name found.
 */
export function findVendorNames(filePath: string, text: string, names: string[]): string[] {
  const lowerText = text.toLowerCase();

  return names
    .filter(name => {
      const parts = lowerText.split(name.toLowerCase());

      return parts
        .slice(0, -1)
        .some((before, index) => !/\w$/.test(before) && !/^\w/.test(parts[index + 1] ?? ""));
    })
    .map(name => `${filePath}: names "${name}"`);
}

/**
 * Find a `version` key in the plugin manifest.
 * @param filePath Path of the manifest from the repository root.
 * @param text Manifest content.
 * @returns A message when the manifest holds a version.
 */
export function findVersionKey(filePath: string, text: string): string[] {
  const {version} = JSON.parse(text) as {version?: string};

  return version === undefined ? [] : [`${filePath}: holds a version key`];
}

/**
 * Tell whether a reference leaves the plugin directory.
 * @param filePath Path of the file that holds the reference, from the repository root.
 * @param target Link target or path token.
 * @returns True for an absolute path, or a relative one that resolves outside the plugin directory.
 */
function isEscapingReference(filePath: string, target: string): boolean {
  const root = path.resolve(pluginRoot);
  const resolved = path.resolve(path.dirname(filePath), target.split("#", 1)[0] ?? "");

  return (
    target.startsWith("/") || (resolved !== root && !resolved.startsWith(`${root}${path.sep}`))
  );
}

/**
 * List the relative paths a text names, as a link target or as a path that starts with `./` or `../`.
 * @param text File content.
 * @returns Each link target and path token that is neither a URL nor an anchor.
 */
function listReferences(text: string): string[] {
  return Array.from(
    text.matchAll(referencePattern),
    ([, link, token]) => link ?? token ?? "",
  ).filter(target => !urlScheme.test(target) && !target.startsWith("#"));
}
