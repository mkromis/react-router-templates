import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import * as toml from "@iarna/toml";
import * as PackageJson from "@npmcli/package-json";
import * as semver from "semver";

export type PackageManager = "yarn" | "pnpm" | "npm";

export interface PackageManagerCommands {
  exec: string;
  lockfile: string;
  name: string;
  run: (script: string, args: string) => string;
}

const cleanupCypressFiles = ({
  fileEntries,
  packageManager,
}: {
  fileEntries: [string, string][];
  packageManager: PackageManagerCommands;
}) =>
  fileEntries.flatMap(([filePath, content]) => {
    const newContent = content.replace(
      new RegExp("npx tsx", "g"),
      packageManager.name === "bun" ? "bun" : `${packageManager.exec} tsx`,
    );

    return [fs.writeFile(filePath, newContent)];
  });

const escapeRegExp = (item: string): string =>
  // $& means the whole matched string
  item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Detects which package manager is used in the workspace based on the lock file.
 */
export function detectPackageManager(dir = ""): PackageManager {
  return existsSync(path.join(dir, "yarn.lock"))
    ? "yarn"
    : existsSync(path.join(dir, "pnpm-lock.yaml"))
      ? "pnpm"
      : "npm";
}

const getPackageManagerCommand = (
  packageManager: PackageManager,
): PackageManagerCommands =>
  // Inspired by https://github.com/nrwl/nx/blob/bd9b33eaef0393d01f747ea9a2ac5d2ca1fb87c6/packages/nx/src/utils/package-manager.ts#L38-L103
  ({
    bun: () => ({
      exec: "bunx",
      lockfile: "bun.lockb",
      name: "bun",
      run: (script: string, args: string) => `bun run ${script} ${args || ""}`,
    }),
    npm: () => ({
      exec: "npx",
      lockfile: "package-lock.json",
      name: "npm",
      run: (script: string, args: string) =>
        `npm run ${script} ${args ? `-- ${args}` : ""}`,
    }),
    pnpm: () => {
      const pnpmVersion = getPackageManagerVersion("pnpm");
      const includeDoubleDashBeforeArgs = semver.lt(pnpmVersion, "7.0.0");
      const useExec = semver.gte(pnpmVersion, "6.13.0");

      return {
        exec: useExec ? "pnpm exec" : "pnpx",
        lockfile: "pnpm-lock.yaml",
        name: "pnpm",
        run: (script: string, args: string) =>
          includeDoubleDashBeforeArgs
            ? `pnpm run ${script} ${args ? `-- ${args}` : ""}`
            : `pnpm run ${script} ${args || ""}`,
      };
    },
    yarn: () => ({
      exec: "yarn",
      lockfile: "yarn.lock",
      name: "yarn",
      run: (script: string, args: string) => `yarn ${script} ${args || ""}`,
    }),
  })[packageManager]();

const getPackageManagerVersion = (packageManager = detectPackageManager()) =>
  // Copied over from https://github.com/nrwl/nx/blob/bd9b33eaef0393d01f747ea9a2ac5d2ca1fb87c6/packages/nx/src/utils/package-manager.ts#L105-L114
  execSync(`${packageManager} --version`).toString("utf-8").trim();

const getRandomString = (length: number) =>
  crypto.randomBytes(length).toString("hex");

const removeUnusedDependencies = (
  dependencies: Record<string, unknown> | ArrayLike<unknown>,
  unusedDependencies: string | string[],
) =>
  Object.fromEntries(
    Object.entries(dependencies).filter(
      ([key]) => !unusedDependencies.includes(key),
    ),
  );

const updatePackageJson = (
  APP_NAME: string,
  packageJson: PackageJson,
  packageManager: PackageManagerCommands,
) => {
  const {
    devDependencies,
    prisma: { seed: prismaSeed, ...prisma },
    scripts: {
      //"format:repo": _repoFormatScript,
      ...scripts
    },
  } = packageJson.content;

  packageJson.update({
    name: APP_NAME,
    devDependencies:
      packageManager.name === "bun"
        ? removeUnusedDependencies(devDependencies, ["tsx"])
        : devDependencies,
    prisma: {
      ...prisma,
      seed:
        packageManager.name === "bun"
          ? prismaSeed.replace("tsx", "bun")
          : prismaSeed,
    },
    scripts,
  });
};

async function main(): Promise<void> {
  // try to set
  let rootDirectory = process.cwd();
  if (path.dirname(rootDirectory) === "remix.init") {
    rootDirectory = path.resolve(rootDirectory, "..");
  }
  console.log("The root folder is at", rootDirectory);

  const packageManager = detectPackageManager();
  const pm = getPackageManagerCommand(packageManager);
  console.log("The package manager is", packageManager);

  const README_PATH = path.join(rootDirectory, "README.md");
  const FLY_TOML_PATH = path.join(rootDirectory, "fly.toml");
  const EXAMPLE_ENV_PATH = path.join(rootDirectory, ".env.example");
  const ENV_PATH = path.join(rootDirectory, ".env");
  const DOCKERFILE_INIT_PATH = path.join(
    rootDirectory,
    "remix.init",
    "Dockerfile." + pm.name,
  );
  const DOCKERFILE_PATH = path.join(rootDirectory, "Dockerfile");
  const CYPRESS_SUPPORT_PATH = path.join(rootDirectory, "cypress", "support");
  const CYPRESS_COMMANDS_PATH = path.join(CYPRESS_SUPPORT_PATH, "commands.ts");
  const CREATE_USER_COMMAND_PATH = path.join(
    CYPRESS_SUPPORT_PATH,
    "create-user.ts",
  );
  const DELETE_USER_COMMAND_PATH = path.join(
    CYPRESS_SUPPORT_PATH,
    "delete-user.ts",
  );

  const REPLACER = "blues-stack-template";

  const DIR_NAME = path.basename(rootDirectory);
  const SUFFIX = getRandomString(2);

  const APP_NAME: string = (DIR_NAME + "-" + SUFFIX)
    // get rid of anything that's not allowed in an app name
    .replace(/[^a-zA-Z0-9-_]/g, "-");

  const [
    prodContent,
    readme,
    env,
    dockerfile,
    cypressCommands,
    createUserCommand,
    deleteUserCommand,
    packageJson,
  ] = await Promise.all([
    fs.readFile(FLY_TOML_PATH, "utf-8"),
    fs.readFile(README_PATH, "utf-8"),
    fs.readFile(EXAMPLE_ENV_PATH, "utf-8"),
    fs.readFile(DOCKERFILE_INIT_PATH, "utf-8"),
    fs.readFile(CYPRESS_COMMANDS_PATH, "utf-8"),
    fs.readFile(CREATE_USER_COMMAND_PATH, "utf-8"),
    fs.readFile(DELETE_USER_COMMAND_PATH, "utf-8"),
    PackageJson.load(rootDirectory),
  ]);

  const newEnv: string = env.replace(
    /^SESSION_SECRET=.*$/m,
    `SESSION_SECRET="${getRandomString(16)}"`,
  );

  const prodToml = toml.parse(prodContent);
  prodToml.app = prodToml.app.toString().replace(REPLACER, APP_NAME);

  const initInstructions = `
  - First run this stack's \`remix.init\` script and commit the changes it makes to your project.

    \`\`\`sh
    npx remix init
    git init # if you haven't already
    git add .
    git commit -m "Initialize project"
    \`\`\`
  `;

  const newReadme: string = readme
    .replace(new RegExp(escapeRegExp(REPLACER), "g"), APP_NAME)
    .replace(initInstructions, "");

  const newDockerfile = pm.lockfile
    ? dockerfile.replace(
        new RegExp(escapeRegExp("ADD package.json"), "g"),
        `ADD package.json ${pm.lockfile}`,
      )
    : dockerfile;

  updatePackageJson(APP_NAME, packageJson, pm);

  await Promise.all([
    fs.writeFile(FLY_TOML_PATH, toml.stringify(prodToml)),
    fs.writeFile(README_PATH, newReadme),
    fs.writeFile(ENV_PATH, newEnv),
    fs.writeFile(DOCKERFILE_PATH, newDockerfile),
    ...cleanupCypressFiles({
      fileEntries: [
        [CYPRESS_COMMANDS_PATH, cypressCommands],
        [CREATE_USER_COMMAND_PATH, createUserCommand],
        [DELETE_USER_COMMAND_PATH, deleteUserCommand],
      ],
      packageManager: pm,
    }),
    packageJson.save(),
    fs.copyFile(
      path.join(rootDirectory, "remix.init", "gitignore"),
      path.join(rootDirectory, ".gitignore"),
    ),
    fs.rm(path.join(rootDirectory, ".github", "ISSUE_TEMPLATE"), {
      recursive: true,
    }),
    fs.rm(path.join(rootDirectory, ".github", "workflows", "format-repo.yml")),
    fs.rm(path.join(rootDirectory, ".github", "workflows", "lint-repo.yml")),
    fs.rm(path.join(rootDirectory, ".github", "workflows", "no-response.yml")),
    fs.rm(path.join(rootDirectory, ".github", "dependabot.yml")),
    fs.rm(path.join(rootDirectory, ".github", "PULL_REQUEST_TEMPLATE.md")),
    fs.rm(path.join(rootDirectory, "LICENSE.md")),
  ]);

  execSync(pm.run("format", "--log-level warn"), {
    cwd: rootDirectory,
    stdio: "inherit",
  });

  console.log(
    `
  Setup is almost complete. Follow these steps to finish initialization:

  - Start the database:
    ${pm.run("docker", "")}

  - Run setup (this updates the database):
    ${pm.run("setup", "")}

  - Run the first build (this generates the server you will run):
    ${pm.run("build", "")}

  - You're now ready to rock and roll 🤘
    ${pm.run("dev", "")}
      `.trim(),
  );
}

// module.exports = main;
main().catch(console.error);
