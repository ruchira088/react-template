import { describe, expect, test, vi, beforeEach } from "vitest"

vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({ name: "BrowserTracing" })),
  replayIntegration: vi.fn(() => ({ name: "Replay" })),
}))

// Force a deterministic environment. Production happens to also have an empty
// DSN in the placeholder mapping, but the choice doesn't matter — we're
// verifying the bail-out path that fires while DSNs are still placeholders.
vi.mock("~/services/Config", () => ({
  Environment: {
    Development: "Development",
    Staging: "Staging",
    Production: "Production",
  },
  getEnvironment: () => "Production",
}))

import * as Sentry from "@sentry/react"
import { initSentry } from "~/services/Sentry"

describe("initSentry", () => {
  beforeEach(() => {
    vi.mocked(Sentry.init).mockReset()
  })

  test("does not call Sentry.init while DSNs are placeholder empty strings", () => {
    initSentry()
    expect(vi.mocked(Sentry.init)).not.toHaveBeenCalled()
  })

  test("is idempotent across repeated calls", () => {
    initSentry()
    initSentry()
    initSentry()
    expect(vi.mocked(Sentry.init)).not.toHaveBeenCalled()
  })
})
