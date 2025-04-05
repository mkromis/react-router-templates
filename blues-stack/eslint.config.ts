import * as path from "node:path";

import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";

import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import cypress from "eslint-plugin-cypress";
import importPlugin from "eslint-plugin-import";
import jest from "eslint-plugin-jest";
import jestDom from "eslint-plugin-jest-dom";
import jsxA11Y from "eslint-plugin-jsx-a11y";
import markdown from "eslint-plugin-markdown";
import react from "eslint-plugin-react";
import testingLibrary from "eslint-plugin-testing-library";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * This is intended to be a basic starting point for linting in the Blues Stack.
 * It relies on recommended configs out of the box for simplicity, but you can
 * and should modify this configuration to best suit your team's needs.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default tseslint.config(
  js.configs.recommended,
  //js.configs.all,
  tseslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {
    files: ["**/*.{js,jsx}"],
    ignores: ["build/**/*", ".react-router/**/*"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["build/", ".react-router/**/*"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.commonjs,
      },

      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  ...fixupConfigRules(
    compat.extends(
      "plugin:react/recommended",
      "plugin:react/jsx-runtime",
      "plugin:react-hooks/recommended",
      "plugin:jsx-a11y/recommended",
      "prettier",
    ),
  ).map((config) => ({
    ...config,
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["build/**/*", ".react-router/**/*"],
  })),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["build/**/*", ".react-router/**/*"],

    plugins: {
      react: fixupPluginRules(react),
      "jsx-a11y": fixupPluginRules(jsxA11Y),
    },

    settings: {
      react: {
        version: "detect",
      },

      formComponents: ["Form"],

      linkComponents: [
        {
          name: "Link",
          linkAttribute: "to",
        },
        {
          name: "NavLink",
          linkAttribute: "to",
        },
      ],
    },

    rules: {
      "react/jsx-no-leaked-render": [
        "warn",
        {
          validStrategies: ["ternary"],
        },
      ],
    },
  },
  ...fixupConfigRules(
    compat.extends("plugin:import/typescript", "prettier"),
  ).map((config) => ({
    ...config,
    files: ["**/*.{ts,tsx}"],
    ignores: ["build/**/*", ".react-router/**/*"],
  })),
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["build/**/*", ".react-router/**/*"],

    plugins: {
      import: fixupPluginRules(importPlugin),
    },

    languageOptions: {
      parser: tsParser,
    },

    settings: {
      "import/internal-regex": "^~/",
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          extensions: [".ts", ".tsx"],
        }),
      ],
    },

    rules: {
      "import/order": [
        "error",
        {
          alphabetize: {
            caseInsensitive: true,
            order: "asc",
          },

          groups: ["builtin", "external", "internal", "parent", "sibling"],
          "newlines-between": "always",
        },
      ],
    },
  },
  ...compat
    .extends("plugin:markdown/recommended-legacy", "prettier")
    .map((config) => ({
      ...config,
      files: ["**/*.md"],
    })),
  {
    files: ["**/*.md"],

    plugins: {
      markdown,
    },
  },
  ...compat
    .extends(
      "plugin:jest/recommended",
      "plugin:jest-dom/recommended",
      "plugin:testing-library/react",
      "prettier",
    )
    .map((config) => ({
      ...config,
      files: ["**/*.test.{js,jsx,ts,tsx}"],
      ignores: ["build/**/*", ".react-router/**/*"],
    })),
  {
    files: ["**/*.test.{js,jsx,ts,tsx}"],
    ignores: ["build/**/*", ".react-router/**/*"],

    plugins: {
      jest,
      "jest-dom": jestDom,
      "testing-library": testingLibrary,
    },

    languageOptions: {
      globals: {
        ...jest.environments.globals.globals,
      },
    },

    settings: {
      jest: {
        version: 28,
      },
    },
  },
  ...compat.extends("plugin:cypress/recommended", "prettier").map((config) => ({
    ...config,
    files: ["cypress/**/*.ts"],
  })),
  {
    files: ["cypress/**/*.ts"],

    plugins: {
      cypress,
    },
  },
  {
    // Node.js server files
    files: ["server/*.ts", "mocks/**/*.js"],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
