import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

// Flat config for the React 19 + TypeScript (Vite) frontend.
// Type-aware linting is enabled via typescript-eslint's `recommendedTypeChecked`
// preset, which uses the project's tsconfig (discovered by `projectService`).
export default tseslint.config(
  // Never lint build output.
  { ignores: ["dist/**"] },

  // Plain JS config files (this file etc.) -- no type information available,
  // so keep them on the non-type-aware recommended ruleset with Node globals.
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },

  // Application source: full type-aware linting plus React rules.
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        // Auto-discovers the nearest tsconfig for each file.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      // Vite fast refresh only works when a module exports components; warn on
      // mixed exports. `allowConstantExport` permits alongside constant exports.
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Allow intentionally-unused identifiers when prefixed with `_`.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Passing an async handler to a JSX attribute (e.g. onSubmit) returns a
      // promise where void is expected; this is idiomatic in React, so only
      // flag genuinely misused promises, not void-returning attributes.
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },

  // Turn off ESLint rules that conflict with Prettier. Must stay last so it
  // wins over any stylistic rules enabled above.
  eslintConfigPrettier,
);
