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
      ],
      // Fails `npm run test:coverage` (and therefore CI) when coverage drops
      // below these. Set a few points under the template's actual numbers so
      // small additions don't trip them but a real regression does.
      thresholds: {
        statements: 90,
        branches: 75,
        functions: 90,
        lines: 90
      }
    }
  },
})