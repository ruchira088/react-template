import { describe, expect, test } from "vitest"

import { cn } from "~/lib/utils"

describe("cn", () => {
  test("joins truthy class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c")
  })

  test("drops falsy/undefined/null entries", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b")
  })

  test("supports clsx object syntax for conditional classes", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active")
  })

  test("tailwind-merges conflicting utilities (last wins)", () => {
    expect(cn("p-2 p-4")).toBe("p-4")
    expect(cn("text-sm font-bold", "text-lg")).toBe("font-bold text-lg")
  })
})
