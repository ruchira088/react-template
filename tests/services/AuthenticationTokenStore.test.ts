import { describe, expect, test, beforeEach } from "vitest"
import { DateTime } from "luxon"

import {
  getAuthenticationToken,
  removeAuthenticationToken,
  setAuthenticationToken,
} from "~/services/authentication/AuthenticationTokenStore"

const token = {
  secret: "test-secret",
  issuedAt: DateTime.fromISO("2026-01-01T00:00:00Z"),
  expiresAt: DateTime.fromISO("2026-12-31T00:00:00Z"),
  renewals: 0,
}

describe("AuthenticationTokenStore", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test("getAuthenticationToken returns None when nothing is stored", () => {
    expect(getAuthenticationToken().isEmpty()).toBe(true)
  })

  test("setAuthenticationToken persists the token so getAuthenticationToken can read it back", () => {
    setAuthenticationToken(token)

    const stored = getAuthenticationToken().toNullable()
    expect(stored?.secret).toBe("test-secret")
    expect(stored?.renewals).toBe(0)
    expect(stored?.issuedAt.toISO()).toBe(token.issuedAt.toISO())
  })

  test("token survives a fresh read from localStorage (round-trips through the codec)", () => {
    setAuthenticationToken(token)

    expect(localStorage.length).toBe(1)
    const raw = localStorage.getItem(localStorage.key(0)!)
    expect(raw).toContain("test-secret")
  })

  test("removeAuthenticationToken returns the previous token and clears storage", () => {
    setAuthenticationToken(token)

    const removed = removeAuthenticationToken()

    expect(removed.toNullable()?.secret).toBe("test-secret")
    expect(getAuthenticationToken().isEmpty()).toBe(true)
    expect(localStorage.length).toBe(0)
  })

  test("removeAuthenticationToken returns None when nothing was stored", () => {
    expect(removeAuthenticationToken().isEmpty()).toBe(true)
  })
})
