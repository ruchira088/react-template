import { describe, expect, test } from "vitest"
import { Option, Some, None } from "~/types/Option"

describe("Option", () => {
  describe("Option.fromNullable", () => {
    test("should return Some for non-null values", () => {
      expect(Option.fromNullable("hello")).toBeInstanceOf(Some)
      expect(Option.fromNullable(0)).toBeInstanceOf(Some)
      expect(Option.fromNullable(false)).toBeInstanceOf(Some)
      expect(Option.fromNullable([])).toBeInstanceOf(Some)
      expect(Option.fromNullable({})).toBeInstanceOf(Some)
    })

    test("should return None for null", () => {
      expect(Option.fromNullable(null)).toBeInstanceOf(None)
    })

    test("should return None for undefined", () => {
      expect(Option.fromNullable(undefined)).toBeInstanceOf(None)
    })
  })
})

describe("Some", () => {
  const someValue = Some.of(42)
  const someString = Some.of("hello")

  describe("map", () => {
    test("should transform the value", () => {
      const result = someValue.map((x) => x * 2)
      expect(result).toBeInstanceOf(Some)
      expect((result as Some<number>).value).toBe(84)
    })

    test("should allow type transformation", () => {
      const result = someValue.map((x) => x.toString())
      expect(result).toBeInstanceOf(Some)
      expect((result as Some<string>).value).toBe("42")
    })
  })

  describe("flatMap", () => {
    test("should chain Option operations", () => {
      const result = someValue.flatMap((x) => Some.of(x + 1))
      expect(result).toBeInstanceOf(Some)
      expect((result as Some<number>).value).toBe(43)
    })

    test("should return None when mapping to None", () => {
      const result = someValue.flatMap(() => None.of<number>())
      expect(result).toBeInstanceOf(None)
    })
  })

  describe("filter", () => {
    test("should return Some when predicate passes", () => {
      const result = someValue.filter((x) => x > 0)
      expect(result).toBeInstanceOf(Some)
      expect((result as Some<number>).value).toBe(42)
    })

    test("should return None when predicate fails", () => {
      const result = someValue.filter((x) => x < 0)
      expect(result).toBeInstanceOf(None)
    })
  })

  describe("fold", () => {
    test("should call onSome with the value", () => {
      const result = someValue.fold(
        () => "none",
        (x) => `value: ${x}`
      )
      expect(result).toBe("value: 42")
    })
  })

  describe("getOrElse", () => {
    test("should return the contained value", () => {
      const result = someValue.getOrElse(() => 0)
      expect(result).toBe(42)
    })
  })

  describe("toNullable", () => {
    test("should return the value", () => {
      expect(someValue.toNullable()).toBe(42)
      expect(someString.toNullable()).toBe("hello")
    })
  })

  describe("toDefined", () => {
    test("should return the value", () => {
      expect(someValue.toDefined()).toBe(42)
    })
  })

  describe("orElse", () => {
    test("should return this (not call the function)", () => {
      const result = someValue.orElse(() => Some.of(100))
      expect(result).toBe(someValue)
      expect((result as Some<number>).value).toBe(42)
    })
  })

  describe("toList", () => {
    test("should return array with the value", () => {
      expect(someValue.toList()).toStrictEqual([42])
    })
  })

  describe("isEmpty", () => {
    test("should return false", () => {
      expect(someValue.isEmpty()).toBe(false)
    })
  })

  describe("forEach", () => {
    test("should execute the function with the value", () => {
      let captured: number | null = null
      someValue.forEach((x) => {
        captured = x
      })
      expect(captured).toBe(42)
    })

    test("should return the function result", () => {
      const result = someValue.forEach((x) => x * 2)
      expect(result).toBe(84)
    })
  })
})

describe("None", () => {
  const noneValue = None.of<number>()

  describe("map", () => {
    test("should return None without calling the function", () => {
      let called = false
      const result = noneValue.map(() => {
        called = true
        return 100
      })
      expect(result).toBeInstanceOf(None)
      expect(called).toBe(false)
    })
  })

  describe("flatMap", () => {
    test("should return None without calling the function", () => {
      let called = false
      const result = noneValue.flatMap(() => {
        called = true
        return Some.of(100)
      })
      expect(result).toBeInstanceOf(None)
      expect(called).toBe(false)
    })
  })

  describe("filter", () => {
    test("should return None regardless of predicate", () => {
      const result = noneValue.filter(() => true)
      expect(result).toBeInstanceOf(None)
    })
  })

  describe("fold", () => {
    test("should call onNone", () => {
      const result = noneValue.fold(
        () => "none",
        () => "some"
      )
      expect(result).toBe("none")
    })
  })

  describe("getOrElse", () => {
    test("should return the default value", () => {
      const result = noneValue.getOrElse(() => 999)
      expect(result).toBe(999)
    })
  })

  describe("toNullable", () => {
    test("should return null", () => {
      expect(noneValue.toNullable()).toBeNull()
    })
  })

  describe("toDefined", () => {
    test("should return undefined", () => {
      expect(noneValue.toDefined()).toBeUndefined()
    })
  })

  describe("orElse", () => {
    test("should call the function and return its result", () => {
      const alternative = Some.of(100)
      const result = noneValue.orElse(() => alternative)
      expect(result).toBe(alternative)
    })
  })

  describe("toList", () => {
    test("should return empty array", () => {
      expect(noneValue.toList()).toStrictEqual([])
    })
  })

  describe("isEmpty", () => {
    test("should return true", () => {
      expect(noneValue.isEmpty()).toBe(true)
    })
  })

  describe("forEach", () => {
    test("should not execute the function", () => {
      let called = false
      noneValue.forEach(async () => {
        called = true
        return 100
      })
      expect(called).toBe(false)
    })

    test("should return a resolved promise", async () => {
      const result = await noneValue.forEach(() => Promise.resolve(100))
      expect(result).toBeUndefined()
    })
  })
})

describe("Option chaining", () => {
  test("should chain multiple operations", () => {
    const result = Some.of(10)
      .map((x) => x * 2)
      .filter((x) => x > 10)
      .flatMap((x) => Some.of(x + 5))
      .getOrElse(() => 0)

    expect(result).toBe(25)
  })

  test("should short-circuit on None", () => {
    const result = Some.of(10)
      .map((x) => x * 2)
      .filter((x) => x > 100) // This fails, returns None
      .flatMap((x) => Some.of(x + 5))
      .getOrElse(() => 0)

    expect(result).toBe(0)
  })

  test("should handle nested Options with flatMap", () => {
    const parseNumber = (s: string): Option<number> => {
      const n = parseInt(s, 10)
      return isNaN(n) ? None.of() : Some.of(n)
    }

    const result1 = Some.of("42").flatMap(parseNumber)
    expect((result1 as Some<number>).value).toBe(42)

    const result2 = Some.of("not a number").flatMap(parseNumber)
    expect(result2).toBeInstanceOf(None)
  })
})
