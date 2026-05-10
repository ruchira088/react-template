import { describe, expect, test, vi } from "vitest"
import { Theme, ApplicationConfiguration } from "~/models/ApplicationConfiguration"
import { ConfigurationService, LocalStorageConfigurationService } from "~/services/config/ConfigurationService"
import { None, Some } from "~/types/Option"

describe("ConfigurationService", () => {
  describe("ConfigurationService abstract class", () => {
    test("getDefaultApplicationConfiguration should return light theme and safeMode false when prefers-color-scheme is not dark", async () => {
      const originalMatchMedia = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: "",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))

      class TestConfigurationService extends ConfigurationService {
        getApplicationConfiguration = vi.fn()
        setApplicationConfiguration = vi.fn()
      }

      const service = new TestConfigurationService()
      const defaultConfig = await service.getDefaultApplicationConfiguration()

      expect(defaultConfig.theme).toBe(Theme.Light)
      expect(defaultConfig.safeMode).toBe(false)

      window.matchMedia = originalMatchMedia
    })

    test("getDefaultApplicationConfiguration should return dark theme when prefers-color-scheme is dark", async () => {
      const originalMatchMedia = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))

      class TestConfigurationService extends ConfigurationService {
        getApplicationConfiguration = vi.fn()
        setApplicationConfiguration = vi.fn()
      }

      const service = new TestConfigurationService()
      const defaultConfig = await service.getDefaultApplicationConfiguration()

      expect(defaultConfig.theme).toBe(Theme.Dark)
      expect(defaultConfig.safeMode).toBe(false)

      window.matchMedia = originalMatchMedia
    })
  })

  describe("LocalStorageConfigurationService", () => {
    const createMockKeyValueStore = () => ({
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })

    test("should get application configuration from key value store", async () => {
      const mockConfig: ApplicationConfiguration = { theme: Theme.Dark, safeMode: true }
      const mockStore = createMockKeyValueStore()
      mockStore.get.mockReturnValue(Some.of(mockConfig))

      const service = new LocalStorageConfigurationService(mockStore as any)
      const result = await service.getApplicationConfiguration()

      expect(result.isEmpty()).toBe(false)
      result.forEach(config => {
        expect(config.theme).toBe(Theme.Dark)
        expect(config.safeMode).toBe(true)
      })
    })

    test("should return None when no configuration exists", async () => {
      const mockStore = createMockKeyValueStore()
      mockStore.get.mockReturnValue(None.of())

      const service = new LocalStorageConfigurationService(mockStore as any)
      const result = await service.getApplicationConfiguration()

      expect(result.isEmpty()).toBe(true)
    })

    test("should set application configuration in key value store", async () => {
      const mockConfig: ApplicationConfiguration = { theme: Theme.Light, safeMode: false }
      const mockStore = createMockKeyValueStore()

      const service = new LocalStorageConfigurationService(mockStore as any)
      await service.setApplicationConfiguration(mockConfig)

      expect(mockStore.put).toHaveBeenCalledWith("AppConfigKey", mockConfig)
    })

    test("should handle theme change from light to dark", async () => {
      const mockStore = createMockKeyValueStore()

      const service = new LocalStorageConfigurationService(mockStore as any)

      await service.setApplicationConfiguration({ theme: Theme.Dark, safeMode: false })
      expect(mockStore.put).toHaveBeenCalledWith("AppConfigKey", { theme: Theme.Dark, safeMode: false })
    })

    test("should handle safe mode change", async () => {
      const mockStore = createMockKeyValueStore()

      const service = new LocalStorageConfigurationService(mockStore as any)

      await service.setApplicationConfiguration({ theme: Theme.Light, safeMode: true })
      expect(mockStore.put).toHaveBeenCalledWith("AppConfigKey", { theme: Theme.Light, safeMode: true })

      await service.setApplicationConfiguration({ theme: Theme.Light, safeMode: false })
      expect(mockStore.put).toHaveBeenCalledWith("AppConfigKey", { theme: Theme.Light, safeMode: false })
    })

    test("should call get with correct key", async () => {
      const mockStore = createMockKeyValueStore()
      mockStore.get.mockReturnValue(None.of())

      const service = new LocalStorageConfigurationService(mockStore as any)
      await service.getApplicationConfiguration()

      expect(mockStore.get).toHaveBeenCalledWith("AppConfigKey")
    })
  })
})
