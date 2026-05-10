import { describe, expect, test } from "vitest"
import { Duration } from "luxon"
import {
  humanReadableSize,
  humanReadableDuration,
  shortHumanReadableDuration,
} from "~/utils/Formatter"

describe("humanReadableSize", () => {
  describe("bytes (< 1000)", () => {
    test("should format 0 bytes", () => {
      expect(humanReadableSize(0)).toBe("0B")
    })

    test("should format small byte values", () => {
      expect(humanReadableSize(1)).toBe("1B")
      expect(humanReadableSize(500)).toBe("500B")
      expect(humanReadableSize(999)).toBe("999B")
    })
  })

  describe("kilobytes (> 1000)", () => {
    test("should format kilobyte values", () => {
      // Note: the function uses < (not <=), so 1000 stays as bytes
      expect(humanReadableSize(1001)).toBe("1kB")
      expect(humanReadableSize(1500)).toBe("2kB")
      expect(humanReadableSize(10000)).toBe("10kB")
      expect(humanReadableSize(999999)).toBe("1000kB")
    })
  })

  describe("megabytes (> 1,000,000)", () => {
    test("should format megabyte values", () => {
      // Note: the function uses < (not <=), so exact boundary stays in previous unit
      expect(humanReadableSize(1000001)).toBe("1MB")
      expect(humanReadableSize(1500000)).toBe("2MB")
      expect(humanReadableSize(10000000)).toBe("10MB")
      expect(humanReadableSize(500000000)).toBe("500MB")
    })
  })

  describe("gigabytes (> 1,000,000,000)", () => {
    test("should format gigabyte values with decimals", () => {
      // Note: the function uses < (not <=), so exact boundary stays in previous unit
      expect(humanReadableSize(1000000001)).toBe("1.00GB")
      expect(humanReadableSize(1500000000)).toBe("1.50GB")
      expect(humanReadableSize(2500000000)).toBe("2.50GB")
      expect(humanReadableSize(10000000000)).toBe("10.00GB")
    })
  })

  describe("alwaysShowDecimals option", () => {
    test("should show decimals for all units when enabled", () => {
      expect(humanReadableSize(500, true)).toBe("500.00B")
      expect(humanReadableSize(1500, true)).toBe("1.50kB")
      expect(humanReadableSize(1500000, true)).toBe("1.50MB")
      expect(humanReadableSize(1500000000, true)).toBe("1.50GB")
    })

    test("should not show decimals by default for non-GB", () => {
      expect(humanReadableSize(1500, false)).toBe("2kB")
      expect(humanReadableSize(1500000, false)).toBe("2MB")
    })
  })

  describe("separator option", () => {
    test("should use custom separator", () => {
      expect(humanReadableSize(1500, false, " ")).toBe("2 kB")
      expect(humanReadableSize(1500000, false, " ")).toBe("2 MB")
      expect(humanReadableSize(1500000000, false, " ")).toBe("1.50 GB")
    })

    test("should use no separator by default", () => {
      expect(humanReadableSize(1500)).toBe("2kB")
    })
  })
})

describe("humanReadableDuration", () => {
  test("should format seconds only", () => {
    const duration = Duration.fromObject({ seconds: 30 })
    expect(humanReadableDuration(duration)).toBe("30 seconds")
  })

  test("should format single second", () => {
    const duration = Duration.fromObject({ seconds: 1 })
    expect(humanReadableDuration(duration)).toBe("1 second")
  })

  test("should format minutes only", () => {
    const duration = Duration.fromObject({ minutes: 5 })
    expect(humanReadableDuration(duration)).toBe("5 minutes")
  })

  test("should format single minute", () => {
    const duration = Duration.fromObject({ minutes: 1 })
    expect(humanReadableDuration(duration)).toBe("1 minute")
  })

  test("should format hours only", () => {
    const duration = Duration.fromObject({ hours: 2 })
    expect(humanReadableDuration(duration)).toBe("2 hours")
  })

  test("should format single hour", () => {
    const duration = Duration.fromObject({ hours: 1 })
    expect(humanReadableDuration(duration)).toBe("1 hour")
  })

  test("should format hours and minutes", () => {
    const duration = Duration.fromObject({ hours: 1, minutes: 30 })
    expect(humanReadableDuration(duration)).toBe("1 hour 30 minutes")
  })

  test("should format minutes and seconds", () => {
    const duration = Duration.fromObject({ minutes: 5, seconds: 45 })
    expect(humanReadableDuration(duration)).toBe("5 minutes 45 seconds")
  })

  test("should format hours, minutes, and seconds", () => {
    const duration = Duration.fromObject({ hours: 2, minutes: 30, seconds: 15 })
    expect(humanReadableDuration(duration)).toBe("2 hours 30 minutes 15 seconds")
  })

  test("should skip zero values", () => {
    const duration = Duration.fromObject({ hours: 1, minutes: 0, seconds: 30 })
    expect(humanReadableDuration(duration)).toBe("1 hour 30 seconds")
  })

  test("should handle duration from seconds", () => {
    const duration = Duration.fromObject({ seconds: 3661 }) // 1h 1m 1s
    expect(humanReadableDuration(duration)).toBe("1 hour 1 minute 1 second")
  })

  test("should return empty string for zero duration", () => {
    const duration = Duration.fromObject({ seconds: 0 })
    expect(humanReadableDuration(duration)).toBe("")
  })
})

describe("shortHumanReadableDuration", () => {
  describe("without hours", () => {
    test("should format seconds only", () => {
      const duration = Duration.fromObject({ seconds: 30 })
      expect(shortHumanReadableDuration(duration)).toBe("0:30")
    })

    test("should format minutes and seconds", () => {
      const duration = Duration.fromObject({ minutes: 5, seconds: 30 })
      expect(shortHumanReadableDuration(duration)).toBe("5:30")
    })

    test("should pad seconds with leading zero", () => {
      const duration = Duration.fromObject({ minutes: 5, seconds: 5 })
      expect(shortHumanReadableDuration(duration)).toBe("5:05")
    })

    test("should handle zero seconds", () => {
      const duration = Duration.fromObject({ minutes: 10, seconds: 0 })
      expect(shortHumanReadableDuration(duration)).toBe("10:00")
    })
  })

  describe("with hours", () => {
    test("should format hours, minutes, and seconds", () => {
      const duration = Duration.fromObject({ hours: 1, minutes: 30, seconds: 45 })
      expect(shortHumanReadableDuration(duration)).toBe("1:30:45")
    })

    test("should pad minutes and seconds with leading zero", () => {
      const duration = Duration.fromObject({ hours: 2, minutes: 5, seconds: 5 })
      expect(shortHumanReadableDuration(duration)).toBe("2:05:05")
    })

    test("should handle zero minutes and seconds", () => {
      const duration = Duration.fromObject({ hours: 1, minutes: 0, seconds: 0 })
      expect(shortHumanReadableDuration(duration)).toBe("1:00:00")
    })

    test("should handle large hour values", () => {
      const duration = Duration.fromObject({ hours: 10, minutes: 30, seconds: 15 })
      expect(shortHumanReadableDuration(duration)).toBe("10:30:15")
    })
  })

  describe("edge cases", () => {
    test("should handle duration from total seconds", () => {
      const duration = Duration.fromObject({ seconds: 3661 }) // 1h 1m 1s
      expect(shortHumanReadableDuration(duration)).toBe("1:01:01")
    })

    test("should handle duration from total seconds without hours", () => {
      const duration = Duration.fromObject({ seconds: 125 }) // 2m 5s
      expect(shortHumanReadableDuration(duration)).toBe("2:05")
    })

    test("should handle exactly one hour", () => {
      const duration = Duration.fromObject({ hours: 1 })
      expect(shortHumanReadableDuration(duration)).toBe("1:00:00")
    })

    test("should handle just under one hour", () => {
      const duration = Duration.fromObject({ minutes: 59, seconds: 59 })
      expect(shortHumanReadableDuration(duration)).toBe("59:59")
    })
  })
})
