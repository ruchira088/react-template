import { describe, expect, test, beforeEach, vi } from "vitest"
import {
  LocalKeyValueStore,
  type KeySpace,
} from "~/services/kv-store/KeyValueStore"
import { Some, None } from "~/types/Option"

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
})()

Object.defineProperty(global, "localStorage", { value: localStorageMock })

describe("LocalKeyValueStore", () => {
  // Simple string-based key space for testing
  const TestKeySpace: KeySpace<string, { name: string; value: number }> = {
    name: "TestStore",
    keyEncoder: {
      encode: (key: string) => key,
    },
    valueCodec: {
      encode: (value: { name: string; value: number }) => JSON.stringify(value),
      decode: (str: string) => JSON.parse(str) as { name: string; value: number },
    },
  }

  let store: LocalKeyValueStore<string, { name: string; value: number }>

  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    store = new LocalKeyValueStore(TestKeySpace)
  })

  describe("stringKey", () => {
    test("should generate correct key format", () => {
      expect(store.stringKey("myKey")).toBe("TestStore-myKey")
    })

    test("should use keySpace name as prefix", () => {
      const customKeySpace: KeySpace<string, string> = {
        name: "CustomStore",
        keyEncoder: { encode: (k) => k },
        valueCodec: {
          encode: (v) => v,
          decode: (v) => v,
        },
      }
      const customStore = new LocalKeyValueStore(customKeySpace)
      expect(customStore.stringKey("test")).toBe("CustomStore-test")
    })

    test("should encode key using keyEncoder", () => {
      const numericKeySpace: KeySpace<number, string> = {
        name: "NumStore",
        keyEncoder: { encode: (n) => `num_${n}` },
        valueCodec: {
          encode: (v) => v,
          decode: (v) => v,
        },
      }
      const numStore = new LocalKeyValueStore(numericKeySpace)
      expect(numStore.stringKey(42)).toBe("NumStore-num_42")
    })
  })

  describe("put", () => {
    test("should store encoded value in localStorage", () => {
      const value = { name: "test", value: 42 }
      store.put("key1", value)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "TestStore-key1",
        JSON.stringify(value)
      )
    })

    test("should overwrite existing value", () => {
      store.put("key1", { name: "first", value: 1 })
      store.put("key1", { name: "second", value: 2 })

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2)
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
        "TestStore-key1",
        JSON.stringify({ name: "second", value: 2 })
      )
    })
  })

  describe("get", () => {
    test("should return Some with value when key exists", () => {
      const value = { name: "test", value: 42 }
      localStorageMock.setItem("TestStore-key1", JSON.stringify(value))

      const result = store.get("key1")

      expect(result).toBeInstanceOf(Some)
      expect((result as Some<{ name: string; value: number }>).value).toStrictEqual(value)
    })

    test("should return None when key does not exist", () => {
      const result = store.get("nonexistent")

      expect(result).toBeInstanceOf(None)
    })

    test("should decode value using valueCodec", () => {
      localStorageMock.setItem("TestStore-key1", '{"name":"decoded","value":99}')

      const result = store.get("key1")

      expect(result).toBeInstanceOf(Some)
      expect((result as Some<{ name: string; value: number }>).value).toStrictEqual({
        name: "decoded",
        value: 99,
      })
    })
  })

  describe("remove", () => {
    test("should return Some with existing value when key exists", () => {
      const value = { name: "test", value: 42 }
      localStorageMock.setItem("TestStore-key1", JSON.stringify(value))

      const result = store.remove("key1")

      expect(result).toBeInstanceOf(Some)
      expect((result as Some<{ name: string; value: number }>).value).toStrictEqual(value)
    })

    test("should return None when key does not exist", () => {
      const result = store.remove("nonexistent")

      expect(result).toBeInstanceOf(None)
    })

    test("should remove key from localStorage", () => {
      localStorageMock.setItem("TestStore-key1", '{"name":"test","value":1}')

      store.remove("key1")

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("TestStore-key1")
    })

    test("should not be retrievable after removal", () => {
      const value = { name: "test", value: 42 }
      store.put("key1", value)

      store.remove("key1")
      const result = store.get("key1")

      expect(result).toBeInstanceOf(None)
    })
  })

  describe("put-get round trip", () => {
    test("should retrieve exactly what was stored", () => {
      const original = { name: "round-trip", value: 123 }
      store.put("testKey", original)

      const result = store.get("testKey")

      expect(result).toBeInstanceOf(Some)
      expect((result as Some<{ name: string; value: number }>).value).toStrictEqual(original)
    })

    test("should handle multiple keys", () => {
      store.put("key1", { name: "first", value: 1 })
      store.put("key2", { name: "second", value: 2 })
      store.put("key3", { name: "third", value: 3 })

      expect((store.get("key1") as Some<{ name: string; value: number }>).value.value).toBe(1)
      expect((store.get("key2") as Some<{ name: string; value: number }>).value.value).toBe(2)
      expect((store.get("key3") as Some<{ name: string; value: number }>).value.value).toBe(3)
    })
  })
})

describe("KeySpace with complex types", () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  test("should handle enum keys", () => {
    enum ConfigKey {
      Theme = "theme",
      Language = "language",
    }

    const configKeySpace: KeySpace<ConfigKey, string> = {
      name: "Config",
      keyEncoder: { encode: (key) => key },
      valueCodec: {
        encode: (v) => v,
        decode: (v) => v,
      },
    }

    const store = new LocalKeyValueStore(configKeySpace)

    store.put(ConfigKey.Theme, "dark")
    store.put(ConfigKey.Language, "en")

    expect((store.get(ConfigKey.Theme) as Some<string>).value).toBe("dark")
    expect((store.get(ConfigKey.Language) as Some<string>).value).toBe("en")
  })

  test("should handle custom codec transformations", () => {
    const dateKeySpace: KeySpace<string, Date> = {
      name: "Dates",
      keyEncoder: { encode: (k) => k },
      valueCodec: {
        encode: (date) => date.toISOString(),
        decode: (str) => new Date(str),
      },
    }

    const store = new LocalKeyValueStore(dateKeySpace)
    const originalDate = new Date("2024-06-15T10:30:00Z")

    store.put("lastVisit", originalDate)
    const result = store.get("lastVisit")

    expect(result).toBeInstanceOf(Some)
    expect((result as Some<Date>).value.toISOString()).toBe(originalDate.toISOString())
  })

  test("should handle array values", () => {
    const arrayKeySpace: KeySpace<string, number[]> = {
      name: "Arrays",
      keyEncoder: { encode: (k) => k },
      valueCodec: {
        encode: (arr) => JSON.stringify(arr),
        decode: (str) => JSON.parse(str) as number[],
      },
    }

    const store = new LocalKeyValueStore(arrayKeySpace)
    const numbers = [1, 2, 3, 4, 5]

    store.put("numbers", numbers)
    const result = store.get("numbers")

    expect(result).toBeInstanceOf(Some)
    expect((result as Some<number[]>).value).toStrictEqual(numbers)
  })
})
