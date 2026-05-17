import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import { AxiosError, AxiosHeaders } from "axios"

// Lightweight axios adapter used when VITE_MOCK_API=true so the template runs
// end-to-end without a backend. Only the auth endpoints are mocked; any other
// request 404s through the adapter to make missing-mock cases obvious.

const MOCK_USER_FIRST_NAME = "Demo"
const MOCK_USER_LAST_NAME = "User"

const isoNow = () => new Date().toISOString()
const isoIn = (millis: number) => new Date(Date.now() + millis).toISOString()

const buildResponse = <T>(
  config: InternalAxiosRequestConfig,
  status: number,
  data: T
): AxiosResponse<T> => ({
  data,
  status,
  statusText: status === 200 ? "OK" : status === 401 ? "Unauthorized" : "Not Found",
  headers: {},
  config,
  request: undefined
})

const buildToken = () => ({
  secret: `mock-${crypto.randomUUID()}`,
  issuedAt: isoNow(),
  expiresAt: isoIn(24 * 60 * 60 * 1000),
  renewals: 0
})

const buildUser = (email: string) => ({
  id: `mock-${email}`,
  createdAt: isoNow(),
  firstName: MOCK_USER_FIRST_NAME,
  lastName: MOCK_USER_LAST_NAME,
  email,
  role: "User" as const
})

const normaliseUrl = (config: InternalAxiosRequestConfig): string => {
  const url = (config.url ?? "").replace(/^\/+/, "/")
  // Drop the baseURL prefix if axios has already inlined it.
  if (config.baseURL && url.startsWith(config.baseURL)) {
    return url.slice(config.baseURL.length).replace(/^\/+/, "/")
  }
  return url.startsWith("/") ? url : `/${url}`
}

const parseBody = (data: unknown): Record<string, unknown> => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  if (data && typeof data === "object") {
    return data as Record<string, unknown>
  }
  return {}
}

// Email is captured at login time so the subsequent /authentication/user lookup
// reflects who "signed in." This is process-memory only; reloads reset it.
let lastLoginEmail: string | null = null

export const mockApiAdapter: AxiosAdapter = async (config: AxiosRequestConfig) => {
  const internalConfig = config as InternalAxiosRequestConfig
  if (!internalConfig.headers) {
    internalConfig.headers = new AxiosHeaders()
  }

  const url = normaliseUrl(internalConfig)
  const method = (internalConfig.method ?? "get").toLowerCase()

  if (method === "post" && url === "/authentication/login") {
    const body = parseBody(internalConfig.data)
    const email = typeof body.email === "string" ? body.email : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!email || !password) {
      throw new AxiosError(
        "Email and password are required.",
        "ERR_BAD_REQUEST",
        internalConfig,
        undefined,
        buildResponse(internalConfig, 400, { message: "Email and password are required." })
      )
    }

    lastLoginEmail = email
    return buildResponse(internalConfig, 200, buildToken())
  }

  if (method === "get" && url === "/authentication/user") {
    if (!lastLoginEmail) {
      throw new AxiosError(
        "Not authenticated.",
        "ERR_BAD_REQUEST",
        internalConfig,
        undefined,
        buildResponse(internalConfig, 401, { message: "Not authenticated." })
      )
    }
    return buildResponse(internalConfig, 200, buildUser(lastLoginEmail))
  }

  if (method === "delete" && url === "/authentication/logout") {
    const email = lastLoginEmail ?? "demo@example.com"
    lastLoginEmail = null
    return buildResponse(internalConfig, 200, buildUser(email))
  }

  throw new AxiosError(
    `No mock handler for ${method.toUpperCase()} ${url}`,
    "ERR_BAD_REQUEST",
    internalConfig,
    undefined,
    buildResponse(internalConfig, 404, { message: "Mock endpoint not found." })
  )
}

// Exposed for tests so they can reset between cases.
export const __resetMockApiState = () => {
  lastLoginEmail = null
}
