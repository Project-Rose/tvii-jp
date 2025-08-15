import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    // TypeScript files
    {
        files: ["**/*.{ts,cts,mts}"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
            },
            globals: { ...globals.browser, ...globals.node },
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            "@typescript-eslint/explicit-function-return-type": ["error"],
        },
    },

    // JavaScript files
    {
        files: ["**/*.{js,cjs,mjs}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: { ...globals.browser, ...globals.node },
        },
        ...pluginJs.configs.recommended,
    },
];
