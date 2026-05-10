import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"

// Mock the ApiConfiguration before importing HttpClient
vi.mock("~/services/ApiConfiguration", () => ({
  apiConfiguration: {
    baseUrl: "http://test-api.example.com",
  },
}))

// Mock the AuthenticationService
const mockRemoveAuthenticationToken = vi.fn()
vi.mock("~/services/authentication/AuthenticationService", () => ({
  removeAuthenticationToken: () => mockRemoveAuthenticationToken(),
}))

describe("HttpClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe("axiosClient configuration", () => {
    test("should create axios instance with correct base URL", async () => {
      const { axiosClient } = await import("~/services/http/HttpClient")
      expect(axiosClient.defaults.baseURL).toBe("http://test-api.example.com")
    })

    test("should create axios instance with withCredentials set to true", async () => {
      const { axiosClient } = await import("~/services/http/HttpClient")
      expect(axiosClient.defaults.withCredentials).toBe(true)
    })
  })

  describe("response interceptor", () => {
    test("should pass through successful responses", async () => {
      const { axiosClient } = await import("~/services/http/HttpClient")

      // Get the response interceptor handlers
      const interceptors = (axiosClient.interceptors.response as any).handlers
      expect(interceptors.length).toBeGreaterThan(0)

      const interceptor = interceptors[0]
      const mockResponse = { data: { message: "success" }, status: 200 }

      const result = await interceptor.fulfilled(mockResponse)
      expect(result).toEqual(mockResponse)
    })

    test("should remove authentication token on 401 error and reject", async () => {
      const { axiosClient } = await import("~/services/http/HttpClient")

      const interceptors = (axiosClient.interceptors.response as any).handlers
      const interceptor = interceptors[0]

      const error401 = {
        response: { status: 401 },
        message: "Unauthorized",
      }

      // The interceptor should remove auth token and reject
      await expect(interceptor.rejected(error401)).rejects.toEqual(error401)
      expect(mockRemoveAuthenticationToken).toHaveBeenCalledTimes(1)
    })

    test("should reject non-401 errors", async () => {
      const { axiosClient } = await import("~/services/http/HttpClient")

      const interceptors = (axiosClient.interceptors.response as any).handlers
      const interceptor = interceptors[0]

      const error500 = {
        response: { status: 500 },
        message: "Internal Server Error",
      }

      await expect(interceptor.rejected(error500)).rejects.toEqual(error500)
      expect(mockRemoveAuthenticationToken).not.toHaveBeenCalled()
    })

    test("should reject errors without response status", async () => {
      const { axiosClient } = await import("~/services/http/HttpClient")

      const interceptors = (axiosClient.interceptors.response as any).handlers
      const interceptor = interceptors[0]

      const networkError = {
        message: "Network Error",
      }

      await expect(interceptor.rejected(networkError)).rejects.toEqual(networkError)
      expect(mockRemoveAuthenticationToken).not.toHaveBeenCalled()
    })

    test("should reject errors with undefined response", async () => {
      const { axiosClient } = await import("~/services/http/HttpClient")

      const interceptors = (axiosClient.interceptors.response as any).handlers
      const interceptor = interceptors[0]

      const errorNoResponse = {
        response: undefined,
        message: "Request failed",
      }

      await expect(interceptor.rejected(errorNoResponse)).rejects.toEqual(errorNoResponse)
      expect(mockRemoveAuthenticationToken).not.toHaveBeenCalled()
    })
  })
})
