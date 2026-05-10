import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import eslintConfigPrettier from "eslint-config-prettier"

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/prefer-as-const": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-empty-pattern": "warn",
    },
  },
  {
    files: ["tests/**/*.ts", "tests/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    ignores: ["node_modules/**", "build/**", "cdk-deploy/**", ".react-router/**"],
  }
)
