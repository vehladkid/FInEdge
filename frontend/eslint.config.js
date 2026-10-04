import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist/", "coverage/", "node_modules/", "playwright-report/", "test-results/"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: { ...globals.browser, ...globals.node }, parserOptions: { ecmaFeatures: { jsx: true } } },
    settings: { react: { version: "detect" } },
    rules: {
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
];
