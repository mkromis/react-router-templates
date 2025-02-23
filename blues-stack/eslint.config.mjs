import globals from "globals";
import { fixupConfigRules, fixupPluginRules, fixupConfigRules } from "@eslint/compat";
import react from "eslint-plugin-react";
import jsxA11Y from "eslint-plugin-jsx-a11y";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import _import from "eslint-plugin-import";
import tsParser from "@typescript-eslint/parser";
import markdown from "eslint-plugin-markdown";
import jest from "eslint-plugin-jest";
import jestDom from "eslint-plugin-jest-dom";
import testingLibrary from "eslint-plugin-testing-library";
import cypress from "eslint-plugin-cypress";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...compat.extends("eslint:recommended"), {
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
}, ...fixupConfigRules(compat.extends(
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "prettier",
)).map(config => ({
    ...config,
    files: ["**/*.{js,jsx,ts,tsx}"],
})), {
    files: ["**/*.{js,jsx,ts,tsx}"],

    plugins: {
        react: fixupPluginRules(react),
        "jsx-a11y": fixupPluginRules(jsxA11Y),
    },

    settings: {
        react: {
            version: "detect",
        },

        formComponents: ["Form"],

        linkComponents: [{
            name: "Link",
            linkAttribute: "to",
        }, {
            name: "NavLink",
            linkAttribute: "to",
        }],
    },

    rules: {
        "react/jsx-no-leaked-render": ["warn", {
            validStrategies: ["ternary"],
        }],
    },
}, ...fixupConfigRules(compat.extends(
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/stylistic",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
)).map(config => ({
    ...config,
    files: ["**/*.{ts,tsx}"],
})), {
    files: ["**/*.{ts,tsx}"],

    plugins: {
        "@typescript-eslint": fixupPluginRules(typescriptEslint),
        import: fixupPluginRules(_import),
    },

    languageOptions: {
        parser: tsParser,
    },

    settings: {
        "import/internal-regex": "^~/",

        "import/resolver": {
            node: {
                extensions: [".ts", ".tsx"],
            },

            typescript: {
                alwaysTryTypes: true,
            },
        },
    },

    rules: {
        "import/order": ["error", {
            alphabetize: {
                caseInsensitive: true,
                order: "asc",
            },

            groups: ["builtin", "external", "internal", "parent", "sibling"],
            "newlines-between": "always",
        }],
    },
}, ...compat.extends("plugin:markdown/recommended-legacy", "prettier").map(config => ({
    ...config,
    files: ["**/*.md"],
})), {
    files: ["**/*.md"],

    plugins: {
        markdown,
    },
}, ...compat.extends(
    "plugin:jest/recommended",
    "plugin:jest-dom/recommended",
    "plugin:testing-library/react",
    "prettier",
).map(config => ({
    ...config,
    files: ["**/*.test.{js,jsx,ts,tsx}"],
})), {
    files: ["**/*.test.{js,jsx,ts,tsx}"],

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
}, ...compat.extends("plugin:cypress/recommended", "prettier").map(config => ({
    ...config,
    files: ["cypress/**/*.ts"],
})), {
    files: ["cypress/**/*.ts"],

    plugins: {
        cypress,
    },
}, {
    files: ["**/.eslintrc.js", "mocks/**/*.js"],

    languageOptions: {
        globals: {
            ...globals.node,
        },
    },
}];