#!/usr/bin/env node

/**
 * SelaluTeh Specs Lifecycle Manager
 *
 * Synchronizes requirements-first spec directories with the `status` declared
 * in each spec.yaml and validates metadata, required documents, active-task
 * pointers, completed-task requirements, and the generated specs index.
 *
 * Commands:
 *   node scripts/specs/sync-spec-folders.mjs --check
 *   node scripts/specs/sync-spec-folders.mjs --check --verbose
 *   node scripts/specs/sync-spec-folders.mjs --fix
 *   node scripts/specs/sync-spec-folders.mjs --fix --dry-run
 *   node scripts/specs/sync-spec-folders.mjs --help
 *
 * Dependency:
 *   npm install --save-dev yaml
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parse, parseDocument } from "yaml";

const DEFAULT_CONFIG_PATH = "specs/specs.config.yaml";

function printHelp() {
  console.log(`
SelaluTeh Specs Lifecycle Manager

Usage:
  node scripts/specs/sync-spec-folders.mjs [options]

Modes:
  --check             Validate only. Never modifies files. This is the default.
  --fix               Move folders and regenerate the specs index.
  --dry-run           Preview --fix actions without modifying files.
  --verbose           Print every validated spec.
  --config <path>     Use a custom config path.
  --help              Show this help.

Examples:
  npm run specs:check
  npm run specs:check:verbose
  npm run specs:sync:dry
  npm run specs:sync
`);
}

function parseArgs(argv) {
  const options = {
    mode: "check",
    dryRun: false,
    verbose: false,
    configPath: DEFAULT_CONFIG_PATH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--check":
        options.mode = "check";
        break;

      case "--fix":
        options.mode = "fix";
        break;

      case "--dry-run":
        options.dryRun = true;
        break;

      case "--verbose":
        options.verbose = true;
        break;

      case "--config": {
        const value = argv[index + 1];

        if (!value) {
          throw new Error("--config requires a path");
        }

        options.configPath = value;
        index += 1;
        break;
      }

      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;

      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.dryRun && options.mode !== "fix") {
    throw new Error("--dry-run must be used together with --fix");
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));
const repoRoot = path.resolve(process.cwd());
const configPath = path.resolve(repoRoot, options.configPath);

const errors = [];
const warnings = [];
const plannedMoves = [];
const specs = [];

function log(message) {
  console.log(message);
}

function debug(message) {
  if (options.verbose) {
    console.log(message);
  }
}

function relative(filePath) {
  return toPosix(path.relative(repoRoot, filePath));
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeTableCell(value) {
  return String(value ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ")
    .trim();
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readText(filePath) {
  return fs.readFile(filePath, "utf8");
}

async function readYaml(filePath) {
  const text = await readText(filePath);
  const data = parse(text);

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`YAML root must be an object: ${relative(filePath)}`);
  }

  return {
    text,
    data,
  };
}

async function writeAtomic(filePath, content) {
  const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;

  await fs.writeFile(temporaryPath, content, "utf8");
  await fs.rename(temporaryPath, filePath);
}

async function listDirectories(parentPath) {
  if (!(await exists(parentPath))) {
    return [];
  }

  const entries = await fs.readdir(parentPath, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(parentPath, entry.name));
}

function setting(config, pathParts, fallback) {
  let current = config;

  for (const part of pathParts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return fallback;
    }

    current = current[part];
  }

  return current;
}

function validateConfig(config) {
  if (typeof config.root !== "string" || config.root.trim() === "") {
    throw new Error("specs.config.yaml: root must be a non-empty string");
  }

  if (
    typeof config.spec_filename !== "string" ||
    config.spec_filename.trim() === ""
  ) {
    throw new Error(
      "specs.config.yaml: spec_filename must be a non-empty string",
    );
  }

  if (
    !Array.isArray(config.allowed_statuses) ||
    config.allowed_statuses.length === 0
  ) {
    throw new Error(
      "specs.config.yaml: allowed_statuses must be a non-empty array",
    );
  }

  for (const status of config.allowed_statuses) {
    if (!config.status_folders?.[status]) {
      throw new Error(`specs.config.yaml: missing status_folders.${status}`);
    }

    if (!Array.isArray(config.workflow_states?.[status])) {
      throw new Error(`specs.config.yaml: missing workflow_states.${status}`);
    }
  }

  if (
    !Array.isArray(config.required_documents) ||
    config.required_documents.length === 0
  ) {
    throw new Error(
      "specs.config.yaml: required_documents must be a non-empty array",
    );
  }

  if (config.movement?.strategy !== "status-based") {
    throw new Error(
      'specs.config.yaml: only movement.strategy "status-based" is supported',
    );
  }

  if (config.movement?.move_entire_spec_directory !== true) {
    throw new Error(
      "specs.config.yaml: move_entire_spec_directory must be true",
    );
  }

  try {
    new RegExp(config.id_pattern ?? ".*");

    new RegExp(config.tasks?.unchecked_pattern ?? "^\\s*-\\s*\\[ \\]");
  } catch (error) {
    throw new Error(
      `specs.config.yaml: invalid regular expression: ${error.message}`,
    );
  }
}

function isOptionalTask(line, optionalMarkers) {
  const normalized = line.toLowerCase();

  return optionalMarkers.some((marker) =>
    normalized.includes(String(marker).toLowerCase()),
  );
}

function markdownLinesOutsideFences(markdown, ignoreFencedCodeBlocks) {
  if (!ignoreFencedCodeBlocks) {
    return markdown.split(/\r?\n/);
  }

  const result = [];
  let insideFence = false;
  let fenceMarker = null;

  for (const line of markdown.split(/\r?\n/)) {
    const trimmed = line.trimStart();
    const match = trimmed.match(/^(```+|~~~+)/);

    if (match) {
      const marker = match[1][0];

      if (!insideFence) {
        insideFence = true;
        fenceMarker = marker;
      } else if (marker === fenceMarker) {
        insideFence = false;
        fenceMarker = null;
      }

      continue;
    }

    if (!insideFence) {
      result.push(line);
    }
  }

  return result;
}

async function findOpenRequiredTasks(specDir, config) {
  const tasksPath = path.join(specDir, "tasks.md");

  if (!(await exists(tasksPath))) {
    return [];
  }

  const text = await readText(tasksPath);

  const uncheckedPattern = new RegExp(
    config.tasks?.unchecked_pattern ?? "^\\s*-\\s*\\[ \\]",
  );

  const optionalMarkers = config.tasks?.optional_markers ?? [];

  const lines = markdownLinesOutsideFences(
    text,
    config.tasks?.ignore_fenced_code_blocks !== false,
  );

  return lines
    .filter((line) => uncheckedPattern.test(line))
    .filter((line) => !isOptionalTask(line, optionalMarkers));
}

async function patchSpecBeforeMove(record, config) {
  const raw = await readText(record.currentSpecPath);

  const document = parseDocument(raw, {
    keepSourceTokens: true,
    prettyErrors: true,
  });

  if (document.errors.length > 0) {
    throw new Error(
      `${record.data.id}: cannot update spec metadata because YAML has errors: ` +
        document.errors.map((error) => error.message).join("; "),
    );
  }

  if (config.movement?.update_timestamp_on_move) {
    document.set("updated_at", todayIsoDate());
  }

  if (config.movement?.update_lifecycle_location_on_move) {
    document.setIn(["lifecycle", "current_bucket"], record.data.status);

    document.setIn(
      ["lifecycle", "current_path"],
      toPosix(path.relative(repoRoot, record.targetDir)),
    );
  }

  await writeAtomic(record.currentSpecPath, String(document));
}

async function moveDirectory(source, target) {
  if (await exists(target)) {
    throw new Error(`Target already exists: ${relative(target)}`);
  }

  await fs.mkdir(path.dirname(target), {
    recursive: true,
  });

  try {
    await fs.rename(source, target);
  } catch (error) {
    if (error?.code !== "EXDEV") {
      throw error;
    }

    await fs.cp(source, target, {
      recursive: true,
      errorOnExist: true,
      force: false,
    });

    await fs.rm(source, {
      recursive: true,
      force: true,
    });
  }
}

async function collectSpecs(config) {
  const specsRoot = path.resolve(repoRoot, config.root);

  const ignored = new Set(config.ignored_directories ?? []);

  for (const [bucketStatus, folderName] of Object.entries(
    config.status_folders,
  )) {
    const bucketPath = path.join(specsRoot, folderName);

    if (options.mode === "fix" && !options.dryRun) {
      await fs.mkdir(bucketPath, {
        recursive: true,
      });
    }

    if (!(await exists(bucketPath))) {
      if (options.mode === "check") {
        errors.push(`Missing status folder: ${relative(bucketPath)}`);
      }

      continue;
    }

    for (const specDir of await listDirectories(bucketPath)) {
      const directoryName = path.basename(specDir);

      if (ignored.has(directoryName)) {
        continue;
      }

      const specPath = path.join(specDir, config.spec_filename);

      if (!(await exists(specPath))) {
        errors.push(`Missing ${config.spec_filename} in ${relative(specDir)}`);

        continue;
      }

      try {
        const { text, data } = await readYaml(specPath);

        specs.push({
          currentStatus: bucketStatus,
          currentDir: specDir,
          currentSpecPath: specPath,
          rawSpec: text,
          data,
          priority: data.priority ?? "unspecified",
          targetDir: null,
        });
      } catch (error) {
        errors.push(error.message);
      }
    }
  }
}

async function validateSpecs(config) {
  const ids = new Map();

  const specsRoot = path.resolve(repoRoot, config.root);

  const idPattern = new RegExp(config.id_pattern ?? ".*");

  const requiredMetadata = config.required_metadata ?? [];

  const allowedPriorities = config.allowed_priorities ?? [];

  for (const record of specs) {
    const { data, currentStatus, currentDir } = record;

    const location = relative(currentDir);

    for (const field of requiredMetadata) {
      if (
        data[field] === undefined ||
        data[field] === null ||
        data[field] === ""
      ) {
        errors.push(`${location}: missing required metadata field "${field}"`);
      }
    }

    const specId = data.id;

    if (!specId || typeof specId !== "string") {
      continue;
    }

    if (!idPattern.test(specId)) {
      errors.push(
        `${specId}: id does not match required pattern ${config.id_pattern}`,
      );
    }

    if (
      setting(config, ["validation", "require_unique_spec_id"], true) &&
      ids.has(specId)
    ) {
      errors.push(
        `Duplicate spec id "${specId}" in ${location} and ${ids.get(specId)}`,
      );
    } else {
      ids.set(specId, location);
    }

    if (
      setting(config, ["validation", "require_folder_name_matches_id"], true) &&
      path.basename(currentDir) !== specId
    ) {
      errors.push(
        `${specId}: folder name "${path.basename(currentDir)}" must match spec id`,
      );
    }

    const declaredStatus = data.status;

    if (
      setting(config, ["validation", "reject_unknown_status"], true) &&
      !config.allowed_statuses.includes(declaredStatus)
    ) {
      errors.push(`${specId}: unknown status "${declaredStatus}"`);

      continue;
    }

    const allowedStates = config.workflow_states?.[declaredStatus] ?? [];

    if (
      setting(config, ["validation", "reject_invalid_workflow_state"], true) &&
      !allowedStates.includes(data.workflow_state)
    ) {
      errors.push(
        `${specId}: workflow_state "${data.workflow_state}" is invalid for ` +
          `status "${declaredStatus}". Allowed: ${allowedStates.join(", ")}`,
      );
    }

    if (
      setting(config, ["validation", "reject_invalid_priority"], true) &&
      allowedPriorities.length > 0 &&
      !allowedPriorities.includes(data.priority)
    ) {
      errors.push(
        `${specId}: priority "${data.priority}" is invalid. ` +
          `Allowed: ${allowedPriorities.join(", ")}`,
      );
    }

    if (setting(config, ["validation", "reject_missing_documents"], true)) {
      for (const filename of config.required_documents) {
        if (!(await exists(path.join(currentDir, filename)))) {
          errors.push(`${specId}: missing required document ${filename}`);
        }
      }
    }

    if (
      declaredStatus === "completed" &&
      setting(
        config,
        ["validation", "reject_completed_with_open_required_tasks"],
        true,
      )
    ) {
      const openRequired = await findOpenRequiredTasks(currentDir, config);

      if (openRequired.length > 0) {
        const preview = openRequired
          .slice(0, 3)
          .map((line) => line.trim())
          .join(" | ");

        errors.push(
          `${specId}: completed is not allowed while ${openRequired.length} ` +
            `required task(s) remain unchecked. ${preview}`,
        );
      }
    }

    const targetBucket = config.status_folders[declaredStatus];

    record.targetDir = path.join(specsRoot, targetBucket, specId);

    if (declaredStatus !== currentStatus) {
      plannedMoves.push({
        record,
        description:
          `${specId}: ${relative(currentDir)} -> ` +
          `${relative(record.targetDir)}`,
      });
    }

    debug(`validated ${specId}`);
  }
}

function getDesiredSpecPath(record, config) {
  return path.join(record.targetDir, config.spec_filename);
}

function findSpecById(specId) {
  return specs.find((record) => record.data.id === specId);
}

function extractFrontMatter(markdown) {
  if (!markdown.startsWith("---")) {
    return null;
  }

  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);

  if (!match) {
    return null;
  }

  const data = parse(match[1]);

  return data && typeof data === "object" && !Array.isArray(data) ? data : null;
}

function taskSourceContainsId(markdown, taskId) {
  const escaped = escapeRegex(taskId);

  const checklistPattern = new RegExp(
    `^\\s*-\\s*\\[[ xX~]\\]\\*?(?:\\s+\\[[^\\]]+\\])*\\s+${escaped}(?=\\s|\\.|:|—|–|-)`,
    "m",
  );

  const headingPattern = new RegExp(
    `^#{1,6}\\s+${escaped}(?=\\s|\\.|:|—|–|-)`,
    "m",
  );

  return checklistPattern.test(markdown) || headingPattern.test(markdown);
}

async function validateCurrentTask(config, requirePhysicalTarget = false) {
  if (!config.current_task?.validate_pointer) {
    return;
  }

  const currentTaskPath = path.resolve(repoRoot, config.current_task.path);

  const missingSeverity =
    config.current_task.missing_file_severity ?? "warning";

  if (!(await exists(currentTaskPath))) {
    const message = `Current task file not found: ${relative(currentTaskPath)}`;

    if (missingSeverity === "error") {
      errors.push(message);
    } else {
      warnings.push(message);
    }

    return;
  }

  let frontMatter;

  try {
    frontMatter = extractFrontMatter(await readText(currentTaskPath));
  } catch (error) {
    errors.push(`Unable to parse current-task.md: ${error.message}`);

    return;
  }

  if (!frontMatter) {
    errors.push(
      `${relative(currentTaskPath)}: YAML front matter is missing or invalid`,
    );

    return;
  }

  const pointerStatus = frontMatter.status ?? "active";

  const allowedPointerStatuses = config.current_task
    .allowed_pointer_statuses ?? ["active", "idle"];

  if (!allowedPointerStatuses.includes(pointerStatus)) {
    errors.push(
      `${relative(currentTaskPath)}: status "${pointerStatus}" is invalid. ` +
        `Allowed: ${allowedPointerStatuses.join(", ")}`,
    );

    return;
  }

  if (pointerStatus === "idle") {
    if (frontMatter.active_spec || frontMatter.active_task) {
      warnings.push(
        `${relative(currentTaskPath)}: idle pointer should omit active_spec and active_task`,
      );
    }

    return;
  }

  const activeSpecId = frontMatter.active_spec?.id;

  const activeSpecPath = frontMatter.active_spec?.path;

  const activeTaskId = frontMatter.active_task?.id;

  const activeTaskSource = frontMatter.active_task?.source;

  if (!activeSpecId || !activeSpecPath) {
    errors.push(
      `${relative(currentTaskPath)}: active_spec.id and active_spec.path are required`,
    );

    return;
  }

  const record = findSpecById(activeSpecId);

  if (!record) {
    errors.push(
      `${relative(currentTaskPath)}: active spec "${activeSpecId}" was not found in the registry`,
    );

    return;
  }

  if (record.data.status !== "active") {
    errors.push(
      `${relative(currentTaskPath)}: spec "${activeSpecId}" has status ` +
        `"${record.data.status}", not "active". Update or clear the pointer before syncing.`,
    );
  }

  const expectedSpecPath = toPosix(
    path.relative(repoRoot, getDesiredSpecPath(record, config)),
  );

  if (
    config.current_task.require_active_spec_path_match !== false &&
    activeSpecPath !== expectedSpecPath
  ) {
    errors.push(
      `${relative(currentTaskPath)}: active_spec.path is "${activeSpecPath}", ` +
        `expected "${expectedSpecPath}"`,
    );
  }

  if (
    config.current_task.require_active_spec_id_match !== false &&
    frontMatter.active_spec.id !== record.data.id
  ) {
    errors.push(
      `${relative(currentTaskPath)}: active_spec.id does not match spec.yaml id`,
    );
  }

  if (config.current_task.require_active_task_source !== false) {
    if (!activeTaskSource) {
      errors.push(
        `${relative(currentTaskPath)}: active_task.source is required`,
      );
    } else {
      const expectedTaskSource = toPosix(
        path.relative(repoRoot, path.join(record.targetDir, "tasks.md")),
      );

      if (activeTaskSource !== expectedTaskSource) {
        errors.push(
          `${relative(currentTaskPath)}: active_task.source is "${activeTaskSource}", ` +
            `expected "${expectedTaskSource}"`,
        );
      }
    }
  }

  const actualTasksPath = path.join(record.currentDir, "tasks.md");

  if (
    config.current_task.require_active_task_id_in_source !== false &&
    activeTaskId &&
    (await exists(actualTasksPath))
  ) {
    const tasksText = await readText(actualTasksPath);

    if (!taskSourceContainsId(tasksText, String(activeTaskId))) {
      errors.push(
        `${relative(currentTaskPath)}: active task id "${activeTaskId}" ` +
          `was not found in ${relative(actualTasksPath)}`,
      );
    }
  }

  if (
    requirePhysicalTarget &&
    !(await exists(getDesiredSpecPath(record, config)))
  ) {
    errors.push(
      `${relative(currentTaskPath)}: active spec target path does not exist after sync: ` +
        expectedSpecPath,
    );
  }
}

function buildIndex(config) {
  const statusOrder = new Map(
    (config.status_order ?? config.allowed_statuses).map((status, index) => [
      status,
      index,
    ]),
  );

  const rows = [...specs]
    .sort((left, right) => {
      const statusDelta =
        (statusOrder.get(left.data.status) ?? 999) -
        (statusOrder.get(right.data.status) ?? 999);

      if (statusDelta !== 0) {
        return statusDelta;
      }

      return String(left.data.title ?? left.data.id).localeCompare(
        String(right.data.title ?? right.data.id),
      );
    })
    .map((record) => {
      const specPath = toPosix(
        path.relative(repoRoot, getDesiredSpecPath(record, config)),
      );

      return (
        `| ${escapeTableCell(record.data.status)} ` +
        `| ${escapeTableCell(record.data.workflow_state)} ` +
        `| ${escapeTableCell(record.data.priority)} ` +
        `| ${escapeTableCell(record.data.id)} ` +
        `| ${escapeTableCell(record.data.title ?? record.data.id)} ` +
        `| \`${specPath}\` |`
      );
    });

  const notice =
    config.index?.managed_notice ??
    "File ini dikelola oleh npm run specs:sync. Jangan edit manual.";

  return [
    "# Specs Index",
    "",
    `> ${notice}`,
    "",
    "| Status | Workflow | Priority | ID | Spec | Path |",
    "|---|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

async function assessIndex(config) {
  if (!config.index?.generate) {
    return {
      changed: false,
      path: null,
      expected: null,
    };
  }

  const indexPath = path.resolve(repoRoot, config.index.path);

  const expected = buildIndex(config);

  const current = (await exists(indexPath)) ? await readText(indexPath) : "";

  return {
    changed: current !== expected,
    path: indexPath,
    expected,
  };
}

async function applyMoves(config) {
  for (const { record, description } of plannedMoves) {
    log(`${options.dryRun ? "[dry-run] " : ""}move ${description}`);

    if (options.dryRun) {
      continue;
    }

    await patchSpecBeforeMove(record, config);

    await moveDirectory(record.currentDir, record.targetDir);

    record.currentDir = record.targetDir;

    record.currentSpecPath = path.join(record.targetDir, config.spec_filename);
  }
}

async function updateIndex(indexAssessment) {
  if (!indexAssessment.changed || !indexAssessment.path) {
    return;
  }

  log(
    `${options.dryRun ? "[dry-run] " : ""}update ${relative(indexAssessment.path)}`,
  );

  if (options.dryRun) {
    return;
  }

  await fs.mkdir(path.dirname(indexAssessment.path), {
    recursive: true,
  });

  await writeAtomic(indexAssessment.path, indexAssessment.expected);
}

function reportWarnings() {
  for (const warning of warnings) {
    console.warn(`warning: ${warning}`);
  }
}

function reportErrors() {
  if (errors.length === 0) {
    return;
  }

  console.error("\nSpec validation failed:\n");

  for (const error of errors) {
    console.error(`- ${error}`);
  }
}

async function main() {
  let config;

  try {
    const { data } = await readYaml(configPath);
    config = data;
    validateConfig(config);
  } catch (error) {
    console.error(`Spec configuration error: ${error.message}`);

    process.exit(1);
  }

  await collectSpecs(config);
  await validateSpecs(config);
  await validateCurrentTask(config, false);

  const indexAssessment = await assessIndex(config);

  if (options.mode === "check") {
    if (
      setting(config, ["validation", "require_folder_status_match"], true) &&
      plannedMoves.length > 0
    ) {
      for (const move of plannedMoves) {
        errors.push(`Folder/status mismatch: ${move.description}`);
      }
    }

    if (indexAssessment.changed) {
      errors.push(
        `Specs index is stale or missing: ${relative(indexAssessment.path)}. ` +
          "Run npm run specs:sync.",
      );
    }

    reportWarnings();
    reportErrors();

    if (errors.length > 0) {
      process.exit(1);
    }

    log(`Spec check passed. ${specs.length} spec(s) validated.`);

    return;
  }

  reportWarnings();
  reportErrors();

  if (errors.length > 0) {
    console.error("\nNo files were changed because validation failed.");

    process.exit(1);
  }

  await applyMoves(config);
  await updateIndex(indexAssessment);

  if (!options.dryRun) {
    await validateCurrentTask(config, true);
  }

  reportErrors();

  if (errors.length > 0) {
    console.error(
      "\nSync completed partially, but post-sync validation failed. " +
        "Review current-task.md and run npm run specs:check.",
    );

    process.exit(1);
  }

  log(
    `${options.dryRun ? "Dry run complete" : "Spec sync complete"}. ` +
      `${specs.length} spec(s) validated, ` +
      `${plannedMoves.length} move(s) planned.`,
  );
}

main().catch((error) => {
  console.error(
    `Unexpected specs lifecycle error: ${error.stack ?? error.message}`,
  );

  process.exit(1);
});
