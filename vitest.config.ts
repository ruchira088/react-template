import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    reporters: process.env.CI ? ["default", "junit", "github-actions"] : ["default"],
    outputFile: {
      junit: "./test-results/junit.xml",
    },
    exclude: [
      "**/node_modules/**",
      "**/build/**",
      "cdk-deploy/**"
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "cobertura"],
      reportsDirectory: "./coverage",
      include: ["app/**/*.{ts,tsx}"],
      exclude: [
        "app/**/*.d.ts",
        "app/**/*.test.{ts,tsx}",
        "app/+types/**",
        "app/entry.{client,server}.tsx",
        "app/routes.ts"
      ]
      // thresholds: set these once your project has stabilised, e.g.
      // { statements: 70, branches: 60, functions: 65, lines: 70 }
    }
  },
})