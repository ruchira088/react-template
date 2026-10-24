import { describe, expect, test } from "vitest"

import { safeRedirectPath, signInPath } from "~/services/authentication/Redirect"

describe("signInPath", () => {
  test("carries the full current location, encoded, in the redirect parameter", () => {
    const path = signInPath({ pathname: "/search", search: "?q=a&b=c", hash: "#top" })

    expect(path).toBe("/sign-in?redirect=%2Fsearch%3Fq%3Da%26b%3Dc%23top")
    expect(new URLSearchParams(path.split("?")[1]).get("redirect")).toBe("/search?q=a&b=c#top")
  })
})

describe("safeRedirectPath", () => {
  test("falls back to / when no redirect is given", () => {
    expect(safeRedirectPath(null)).toBe("/")
  })

  test.each([
    "/dashboard",
    "/search?q=x#top",
    "/a/b/c"
  ])("keeps the same-origin path %s", path => {
    expect(safeRedirectPath(path)).toBe(path)
  })

  test.each([
    "https://evil.example.com",
    "//evil.example.com",
    "/\\evil.example.com",
    "/\t/evil.example.com",
    "/\n/evil.example.com",
    "javascript:alert(1)",
    "dashboard",
    ""
  ])("rejects %s and falls back to /", path => {
    expect(safeRedirectPath(path)).toBe("/")
  })
})
