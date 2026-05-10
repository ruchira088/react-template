import { describe, expect, test } from "vitest"
import { Either, Right, Left } from "~/types/Either"
import { Some, None } from "~/types/Option"

describe("Either", () => {
  describe("Either.fromTry", () => {
    test("should return Right for successful function", () => {
      const result = Either.fromTry(() => 42)
      expect(result).toBeInstanceOf(Right)
      expect((result as Right<Error, number>).value).toBe(42)
    })

    test("should return Left for throwing function", () => {
      const error = new Error("test error")
      const result = Either.fromTry<number>(() => {
        throw error
      })
      expect(result).toBeInstanceOf(Left)
      expect((result as Left<Error, number>).value).toBe(error)
    })

    test("should handle JSON parsing", () => {
      const validJson = Either.fromTry(() => JSON.parse('{"a": 1}'))
      expect(validJson).toBeInstanceOf(Right)
      expect((validJson as Right<Error, object>).value).toStrictEqual({ a: 1 })

      const invalidJson = Either.fromTry(() => JSON.parse("not json"))
      expect(invalidJson).toBeInstanceOf(Left)
    })
  })
})

describe("Right", () => {
  const rightValue = Right.of<string, number>(42)

  describe("map", () => {
    test("should transform the value", () => {
      const result = rightValue.map((x) => x * 2)
      expect(result).toBeInstanceOf(Right)
      expect((result as Right<string, number>).value).toBe(84)
    })

    test("should allow type transformation", () => {
      const result = rightValue.map((x) => `value: ${x}`)
      expect(result).toBeInstanceOf(Right)
      expect((result as Right<string, string>).value).toBe("value: 42")
    })
  })

  describe("flatMap", () => {
    test("should chain Either operations with Right", () => {
      const result = rightValue.flatMap((x) => Right.of<string, number>(x + 1))
      expect(result).toBeInstanceOf(Right)
      expect((result as Right<string, number>).value).toBe(43)
    })

    test("should return Left when flatMap returns Left", () => {
      const result = rightValue.flatMap(() => Left.of<string, number>("error"))
      expect(result).toBeInstanceOf(Left)
      expect((result as Left<string, number>).value).toBe("error")
    })
  })

  describe("fold", () => {
    test("should call onRight with the value", () => {
      const result = rightValue.fold(
        (err) => `error: ${err}`,
        (val) => `success: ${val}`
      )
      expect(result).toBe("success: 42")
    })
  })

  describe("toOption", () => {
    test("should return Some with the value", () => {
      const result = rightValue.toOption()
      expect(result).toBeInstanceOf(Some)
      expect((result as Some<number>).value).toBe(42)
    })
  })
})

describe("Left", () => {
  const leftValue = Left.of<string, number>("error occurred")

  describe("map", () => {
    test("should not transform and return Left", () => {
      let called = false
      const result = leftValue.map(() => {
        called = true
        return 100
      })
      expect(result).toBeInstanceOf(Left)
      expect((result as Left<string, number>).value).toBe("error occurred")
      expect(called).toBe(false)
    })
  })

  describe("flatMap", () => {
    test("should not chain and return Left", () => {
      let called = false
      const result = leftValue.flatMap(() => {
        called = true
        return Right.of<string, number>(100)
      })
      expect(result).toBeInstanceOf(Left)
      expect((result as Left<string, number>).value).toBe("error occurred")
      expect(called).toBe(false)
    })
  })

  describe("fold", () => {
    test("should call onLeft with the error", () => {
      const result = leftValue.fold(
        (err) => `error: ${err}`,
        (val) => `success: ${val}`
      )
      expect(result).toBe("error: error occurred")
    })
  })

  describe("toOption", () => {
    test("should return None", () => {
      const result = leftValue.toOption()
      expect(result).toBeInstanceOf(None)
    })
  })
})

describe("Either chaining", () => {
  const safeDivide = (a: number, b: number): Either<string, number> => {
    if (b === 0) {
      return Left.of("Division by zero")
    }
    return Right.of(a / b)
  }

  const safeSquareRoot = (n: number): Either<string, number> => {
    if (n < 0) {
      return Left.of("Cannot take square root of negative number")
    }
    return Right.of(Math.sqrt(n))
  }

  test("should chain successful operations", () => {
    const result = safeDivide(100, 4)
      .flatMap((x) => safeSquareRoot(x))
      .map((x) => x * 2)

    expect(result).toBeInstanceOf(Right)
    expect((result as Right<string, number>).value).toBe(10)
  })

  test("should short-circuit on first error", () => {
    const result = safeDivide(100, 0)
      .flatMap((x) => safeSquareRoot(x))
      .map((x) => x * 2)

    expect(result).toBeInstanceOf(Left)
    expect((result as Left<string, number>).value).toBe("Division by zero")
  })

  test("should capture error from later operation", () => {
    const result = safeDivide(-16, 1)
      .flatMap((x) => safeSquareRoot(x))
      .map((x) => x * 2)

    expect(result).toBeInstanceOf(Left)
    expect((result as Left<string, number>).value).toBe(
      "Cannot take square root of negative number"
    )
  })

  test("should integrate with Option through toOption", () => {
    const successResult = safeDivide(100, 4).toOption()
    expect(successResult).toBeInstanceOf(Some)
    expect((successResult as Some<number>).value).toBe(25)

    const failureResult = safeDivide(100, 0).toOption()
    expect(failureResult).toBeInstanceOf(None)
  })
})

describe("Either with Error type", () => {
  test("should handle Error objects in Left", () => {
    const result = Left.of<Error, number>(new Error("Something went wrong"))

    const message = result.fold(
      (err) => err.message,
      (val) => `value: ${val}`
    )

    expect(message).toBe("Something went wrong")
  })

  test("should handle try-catch pattern", () => {
    const parseJSON = (str: string): Either<Error, unknown> => {
      return Either.fromTry(() => JSON.parse(str))
    }

    const valid = parseJSON('{"name": "test"}')
    expect(valid).toBeInstanceOf(Right)

    const invalid = parseJSON("not valid json")
    expect(invalid).toBeInstanceOf(Left)
    expect((invalid as Left<Error, unknown>).value).toBeInstanceOf(SyntaxError)
  })
})
