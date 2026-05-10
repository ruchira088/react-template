import { describe, expect, test } from "vitest"
import { maybeString } from "~/utils/StringUtils"
import { None, Some } from "~/types/Option"

describe("maybeString", () => {
  describe("empty and whitespace strings", () => {
    test("should return None for empty string", () => {
      expect(maybeString("")).toBeInstanceOf(None)
    })

    test("should return None for whitespace-only string", () => {
      expect(maybeString("   ")).toBeInstanceOf(None)
      expect(maybeString("\t")).toBeInstanceOf(None)
      expect(maybeString("\n")).toBeInstanceOf(None)
      expect(maybeString("  \t\n  ")).toBeInstanceOf(None)
    })
  })

  describe("non-empty strings", () => {
    test("should return Some for non-empty string", () => {
      const result = maybeString("test")
      expect(result).toBeInstanceOf(Some)
      expect((result as Some<string>).value).toBe("test")
    })

    test("should return Some for string with leading/trailing whitespace", () => {
      const result = maybeString("  hello  ")
      expect(result).toBeInstanceOf(Some)
      expect((result as Some<string>).value).toBe("  hello  ")
    })

    test("should return Some for single character", () => {
      const result = maybeString("a")
      expect(result).toBeInstanceOf(Some)
      expect((result as Some<string>).value).toBe("a")
    })

    test("should return Some for numeric string", () => {
      const result = maybeString("123")
      expect(result).toBeInstanceOf(Some)
      expect((result as Some<string>).value).toBe("123")
    })

    test("should return Some for special characters", () => {
      const result = maybeString("!@#$%")
      expect(result).toBeInstanceOf(Some)
      expect((result as Some<string>).value).toBe("!@#$%")
    })

    test("should return Some for unicode characters", () => {
      const result = maybeString("你好世界")
      expect(result).toBeInstanceOf(Some)
      expect((result as Some<string>).value).toBe("你好世界")
    })
  })

  describe("Option operations on result", () => {
    test("should allow chaining map on Some result", () => {
      const result = maybeString("hello")
        .map((s) => s.toUpperCase())
        .getOrElse(() => "default")

      expect(result).toBe("HELLO")
    })

    test("should return default on None result", () => {
      const result = maybeString("")
        .map((s) => s.toUpperCase())
        .getOrElse(() => "default")

      expect(result).toBe("default")
    })

    test("should work with filter", () => {
      const longEnough = maybeString("hello").filter((s) => s.length >= 5)
      expect(longEnough).toBeInstanceOf(Some)

      const tooShort = maybeString("hi").filter((s) => s.length >= 5)
      expect(tooShort).toBeInstanceOf(None)
    })

    test("should work with fold", () => {
      const someResult = maybeString("test").fold(
        () => "was empty",
        (s) => `got: ${s}`
      )
      expect(someResult).toBe("got: test")

      const noneResult = maybeString("").fold(
        () => "was empty",
        (s) => `got: ${s}`
      )
      expect(noneResult).toBe("was empty")
    })
  })
})