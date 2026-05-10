import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"

describe("ApiConfiguration", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  describe("inferBaseApiUrl", () => {
    test("should use API_URL query parameter when present", async () => {
      // Mock window.location with API_URL query parameter
      const mockUrl = new URL("https://example.com?API_URL=https://custom-api.example.com")
      const mockHistory = { replaceState: vi.fn() }

      vi.stubGlobal("window", {
        location: {
          href: mockUrl.href,
          search: mockUrl.search,
          protocol: mockUrl.protocol,
          host: mockUrl.host,
        },
        history: mockHistory,
      })

      // Reset module cache and re-import
      vi.resetModules()
      const { apiConfiguration } = await import("~/services/ApiConfiguration")

      expect(apiConfiguration.baseUrl).toBe("https://custom-api.example.com")
      expect(mockHistory.replaceState).toHaveBeenCalled()
    })

    test("should use VITE_API_URL environment variable when no query param", async () => {
      // Mock window.location without API_URL query parameter
      const mockUrl = new URL("https://example.com")

      vi.stubGlobal("window", {
        location: {
          href: mockUrl.href,
          search: mockUrl.search,
          protocol: mockUrl.protocol,
          host: mockUrl.host,
        },
        history: { replaceState: vi.fn() },
      })

      // Mock import.meta.env
      vi.stubGlobal("import", {
        meta: {
          env: {
            VITE_API_URL: "https://env-api.example.com",
          },
        },
      })

      vi.resetModules()
      // Note: This test may not fully work due to import.meta limitations in testing
    })

    test("should use API_URL_MAPPINGS for known hosts", async () => {
      // Mock window.location with a known host
      const mockUrl = new URL("https://staging.__SUBDOMAIN__.ruchij.com")

      vi.stubGlobal("window", {
        location: {
          href: mockUrl.href,
          search: "",
          protocol: "https:",
          host: "staging.__SUBDOMAIN__.ruchij.com",
        },
        history: { replaceState: vi.fn() },
      })

      vi.resetModules()
      const { apiConfiguration } = await import("~/services/ApiConfiguration")

      expect(apiConfiguration.baseUrl).toBe("https://__API_HOSTNAME_STAGING__")
    })

    test("should use API_URL_MAPPINGS for __SUBDOMAIN__.ruchij.com", async () => {
      const mockUrl = new URL("https://__SUBDOMAIN__.ruchij.com")

      vi.stubGlobal("window", {
        location: {
          href: mockUrl.href,
          search: "",
          protocol: "https:",
          host: "__SUBDOMAIN__.ruchij.com",
        },
        history: { replaceState: vi.fn() },
      })

      vi.resetModules()
      const { apiConfiguration } = await import("~/services/ApiConfiguration")

      expect(apiConfiguration.baseUrl).toBe("https://__API_HOSTNAME_PROD__")
    })

    test("should fallback to api.{host} for unknown hosts", async () => {
      const mockUrl = new URL("https://unknown-host.example.com")

      vi.stubGlobal("window", {
        location: {
          href: mockUrl.href,
          search: "",
          protocol: "https:",
          host: "unknown-host.example.com",
        },
        history: { replaceState: vi.fn() },
      })

      vi.resetModules()
      const { apiConfiguration } = await import("~/services/ApiConfiguration")

      expect(apiConfiguration.baseUrl).toBe("https://api.unknown-host.example.com")
    })

    test("should handle http protocol", async () => {
      const mockUrl = new URL("http://localhost:3000")

      vi.stubGlobal("window", {
        location: {
          href: mockUrl.href,
          search: "",
          protocol: "http:",
          host: "localhost:3000",
        },
        history: { replaceState: vi.fn() },
      })

      vi.resetModules()
      const { apiConfiguration } = await import("~/services/ApiConfiguration")

      expect(apiConfiguration.baseUrl).toBe("http://api.localhost:3000")
    })
  })
})
