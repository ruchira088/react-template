import { describe, expect, test, beforeEach } from "vitest"
import type { InternalAxiosRequestConfig } from "axios"
import { AxiosError, AxiosHeaders } from "axios"

import { mockApiAdapter, __resetMockApiState } from "~/services/http/MockApi"
import { AuthenticationToken } from "~/models/AuthenticationToken"
import { Role, User } from "~/models/User"
import { zodParse } from "~/types/Zod"

const buildConfig = (
  method: string,
  url: string,
  data?: unknown
): InternalAxiosRequestConfig => ({
  method,
  url,
  data: data === undefined ? undefined : JSON.stringify(data),
  headers: new AxiosHeaders(),
})

describe("MockApi adapter", () => {
  beforeEach(() => {
    __resetMockApiState()
  })

  test("POST /authentication/login returns a token that parses as AuthenticationToken", async () => {
    const response = await mockApiAdapter(
      buildConfig("post", "/authentication/login", { email: "demo@example.com", password: "anything" })
    )

    expect(response.status).toBe(200)

    const token = zodParse(AuthenticationToken, response.data)
    expect(token.secret).toMatch(/^mock-/)
    expect(token.renewals).toBe(0)
    expect(token.expiresAt.toMillis()).toBeGreaterThan(token.issuedAt.toMillis())
  })

  test("POST /authentication/login rejects empty credentials with a 400", async () => {
    await expect(
      mockApiAdapter(buildConfig("post", "/authentication/login", { email: "", password: "" }))
    ).rejects.toMatchObject({ response: { status: 400 } })
  })

  test("GET /authentication/user returns the previously-signed-in user", async () => {
    await mockApiAdapter(
      buildConfig("post", "/authentication/login", { email: "alice@example.com", password: "pw" })
    )

    const response = await mockApiAdapter(buildConfig("get", "/authentication/user"))
    const user = zodParse(User, response.data)

    expect(user.email).toBe("alice@example.com")
    expect(user.role).toBe(Role.User)
  })

  test("GET /authentication/user returns 401 when no login has occurred", async () => {
    await expect(mockApiAdapter(buildConfig("get", "/authentication/user")))
      .rejects.toMatchObject({ response: { status: 401 } })
  })

  test("DELETE /authentication/logout clears the session and returns the prior user", async () => {
    await mockApiAdapter(
      buildConfig("post", "/authentication/login", { email: "bob@example.com", password: "pw" })
    )

    const logout = await mockApiAdapter(buildConfig("delete", "/authentication/logout"))
    const user = zodParse(User, logout.data)
    expect(user.email).toBe("bob@example.com")

    await expect(mockApiAdapter(buildConfig("get", "/authentication/user")))
      .rejects.toMatchObject({ response: { status: 401 } })
  })

  test("unmocked endpoints return 404", async () => {
    await expect(mockApiAdapter(buildConfig("get", "/something-else")))
      .rejects.toBeInstanceOf(AxiosError)
  })
})
