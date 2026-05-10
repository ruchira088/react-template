import { describe, expect, test } from "vitest"
import { z } from "zod/v4"
import { DateTime, Duration } from "luxon"
import { ZodDuration, ZodDateTime, ZodOptional, zodParse } from "~/types/Zod"
import { Some, None } from "~/types/Option"

describe("ZodDuration", () => {
  test("should parse duration with seconds", () => {
    const input = { length: 30, unit: "seconds" }
    const result = ZodDuration.parse(input)

    expect(result).toBeInstanceOf(Duration)
    expect(result.as("seconds")).toBe(30)
  })

  test("should parse duration with minutes", () => {
    const input = { length: 5, unit: "minutes" }
    const result = ZodDuration.parse(input)

    expect(result).toBeInstanceOf(Duration)
    expect(result.as("minutes")).toBe(5)
    expect(result.as("seconds")).toBe(300)
  })

  test("should parse duration with hours", () => {
    const input = { length: 2, unit: "hours" }
    const result = ZodDuration.parse(input)

    expect(result).toBeInstanceOf(Duration)
    expect(result.as("hours")).toBe(2)
    expect(result.as("minutes")).toBe(120)
  })

  test("should reject invalid duration object", () => {
    const invalidInputs = [
      { length: "not a number", unit: "seconds" },
      { length: 30 }, // missing unit
      { unit: "seconds" }, // missing length
      null,
      undefined,
    ]

    invalidInputs.forEach((input) => {
      expect(() => ZodDuration.parse(input)).toThrow()
    })
  })
})

describe("ZodDateTime", () => {
  test("should parse valid ISO datetime string with offset", () => {
    const isoString = "2024-01-15T10:30:00+00:00"
    const result = ZodDateTime.parse(isoString)

    expect(result).toBeInstanceOf(DateTime)
    expect(result.isValid).toBe(true)
    // Note: Luxon converts to local timezone, so we check the UTC values
    expect(result.toUTC().year).toBe(2024)
    expect(result.toUTC().month).toBe(1)
    expect(result.toUTC().day).toBe(15)
    expect(result.toUTC().hour).toBe(10)
    expect(result.toUTC().minute).toBe(30)
  })

  test("should parse datetime with positive offset", () => {
    const isoString = "2024-06-20T14:45:30+05:30"
    const result = ZodDateTime.parse(isoString)

    expect(result).toBeInstanceOf(DateTime)
    expect(result.isValid).toBe(true)
  })

  test("should parse datetime with negative offset", () => {
    const isoString = "2024-12-25T08:00:00-08:00"
    const result = ZodDateTime.parse(isoString)

    expect(result).toBeInstanceOf(DateTime)
    expect(result.isValid).toBe(true)
  })

  test("should parse datetime with Z offset", () => {
    const isoString = "2024-03-10T12:00:00Z"
    const result = ZodDateTime.parse(isoString)

    expect(result).toBeInstanceOf(DateTime)
    expect(result.isValid).toBe(true)
  })

  test("should reject invalid datetime strings", () => {
    const invalidInputs = [
      "not a date",
      "2024-01-15", // missing time
      "10:30:00", // missing date
      "2024/01/15T10:30:00Z", // wrong separator
      123456789,
      null,
    ]

    invalidInputs.forEach((input) => {
      expect(() => ZodDateTime.parse(input)).toThrow()
    })
  })
})

describe("ZodOptional", () => {
  const OptionalString = ZodOptional(z.string())
  const OptionalNumber = ZodOptional(z.number())

  test("should return Some for present value", () => {
    const result = OptionalString.parse("hello")

    expect(result).toBeInstanceOf(Some)
    expect((result as Some<string>).value).toBe("hello")
  })

  test("should return None for null", () => {
    const result = OptionalString.parse(null)

    expect(result).toBeInstanceOf(None)
  })

  test("should return None for undefined", () => {
    const result = OptionalString.parse(undefined)

    expect(result).toBeInstanceOf(None)
  })

  test("should work with number type", () => {
    const someResult = OptionalNumber.parse(42)
    expect(someResult).toBeInstanceOf(Some)
    expect((someResult as Some<number>).value).toBe(42)

    const noneResult = OptionalNumber.parse(null)
    expect(noneResult).toBeInstanceOf(None)
  })

  test("should work with complex types", () => {
    const PersonSchema = z.object({
      name: z.string(),
      age: z.number(),
    })
    const OptionalPerson = ZodOptional(PersonSchema)

    const someResult = OptionalPerson.parse({ name: "John", age: 30 })
    expect(someResult).toBeInstanceOf(Some)
    expect((someResult as Some<{ name: string; age: number }>).value).toStrictEqual({
      name: "John",
      age: 30,
    })

    const noneResult = OptionalPerson.parse(null)
    expect(noneResult).toBeInstanceOf(None)
  })

  test("should reject invalid inner type", () => {
    expect(() => OptionalString.parse(123)).toThrow()
    expect(() => OptionalNumber.parse("not a number")).toThrow()
  })
})

describe("zodParse", () => {
  const TestSchema = z.object({
    id: z.string(),
    count: z.number(),
  })

  test("should parse valid data", () => {
    const input = { id: "abc123", count: 42 }
    const result = zodParse(TestSchema, input)

    expect(result).toStrictEqual(input)
  })

  test("should throw on invalid data", () => {
    const invalidInput = { id: 123, count: "not a number" }

    expect(() => zodParse(TestSchema, invalidInput)).toThrow()
  })

  test("should throw on missing fields", () => {
    const partialInput = { id: "abc123" }

    expect(() => zodParse(TestSchema, partialInput)).toThrow()
  })

  test("should work with primitive types", () => {
    expect(zodParse(z.string(), "hello")).toBe("hello")
    expect(zodParse(z.number(), 42)).toBe(42)
    expect(zodParse(z.boolean(), true)).toBe(true)
  })

  test("should work with arrays", () => {
    const ArraySchema = z.array(z.number())
    const result = zodParse(ArraySchema, [1, 2, 3])

    expect(result).toStrictEqual([1, 2, 3])
  })

  test("should work with ZodDateTime", () => {
    const isoString = "2024-01-15T10:30:00Z"
    const result = zodParse(ZodDateTime, isoString)

    expect(result).toBeInstanceOf(DateTime)
    expect(result.toUTC().year).toBe(2024)
  })

  test("should work with ZodDuration", () => {
    const durationInput = { length: 60, unit: "seconds" }
    const result = zodParse(ZodDuration, durationInput)

    expect(result).toBeInstanceOf(Duration)
    expect(result.as("seconds")).toBe(60)
  })
})

describe("Combined Zod schemas", () => {
  test("should work with nested optional DateTime", () => {
    const Schema = z.object({
      name: z.string(),
      createdAt: ZodDateTime,
      updatedAt: ZodOptional(ZodDateTime),
    })

    const withUpdatedAt = Schema.parse({
      name: "test",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    })

    expect(withUpdatedAt.name).toBe("test")
    expect(withUpdatedAt.createdAt).toBeInstanceOf(DateTime)
    expect(withUpdatedAt.updatedAt).toBeInstanceOf(Some)

    const withoutUpdatedAt = Schema.parse({
      name: "test",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: null,
    })

    expect(withoutUpdatedAt.updatedAt).toBeInstanceOf(None)
  })
})
