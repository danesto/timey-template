import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import checkFile from "eslint-plugin-check-file";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    plugins: { "check-file": checkFile },
    rules: {
      // Everything on disk is kebab-case: one convention, no arguments about
      // it in review, and no case-only renames that git silently ignores on
      // macOS but Linux does not.
      "check-file/filename-naming-convention": [
        "error",
        { "**/*.{ts,tsx,js,jsx,mjs}": "KEBAB_CASE" },
        { ignoreMiddleExtensions: true },
      ],
      "check-file/folder-naming-convention": [
        "error",
        {
          // Route groups, dynamic segments and slots are Next.js grammar.
          "app/**": "NEXT_JS_APP_ROUTER_CASE",
          "components/**": "KEBAB_CASE",
          "features/**": "KEBAB_CASE",
          "lib/**": "KEBAB_CASE",
        },
      ],
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "lib/db/migrations/**",
    "design/**",
  ]),
]);

export default eslintConfig;
