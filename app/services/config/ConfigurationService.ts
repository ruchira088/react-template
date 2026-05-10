import { type KeySpace, type KeyValueStore, LocalKeyValueStore } from "~/services/kv-store/KeyValueStore"
import type { Option } from "~/types/Option"
import { ApplicationConfiguration, Theme } from "~/models/ApplicationConfiguration"

export abstract class ConfigurationService {
  abstract getApplicationConfiguration(): Promise<Option<ApplicationConfiguration>>;

  abstract setApplicationConfiguration(configuration: ApplicationConfiguration): Promise<void>;

  getDefaultApplicationConfiguration(): Promise<ApplicationConfiguration> {
    const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    const theme = prefersDark ? Theme.Dark : Theme.Light
    return Promise.resolve({ theme, safeMode: false })
  }
}

const AppConfigKey = "AppConfigKey" as const

const ApplicationConfigurationKeySpace: KeySpace<typeof AppConfigKey, ApplicationConfiguration> = {
  name: "application-configuration",
  keyEncoder: {
    encode: function(value: typeof AppConfigKey): string {
      return value
    }
  },
  valueCodec: {
    encode: function(value: ApplicationConfiguration): string {
      return JSON.stringify(value)
    },
    decode: function(value: string): ApplicationConfiguration {
      return ApplicationConfiguration.parse(JSON.parse(value))
    }
  }
}

export class LocalStorageConfigurationService extends ConfigurationService {
  constructor(readonly keyValueStore: KeyValueStore<typeof AppConfigKey, ApplicationConfiguration>) {
    super()
  }

  getApplicationConfiguration(): Promise<Option<ApplicationConfiguration>> {
    return Promise.resolve(this.keyValueStore.get(AppConfigKey))
  }

  setApplicationConfiguration(configuration: ApplicationConfiguration): Promise<void> {
    this.keyValueStore.put(AppConfigKey, configuration)
    return Promise.resolve()
  }
}

export const localStorageConfigurationService =
  new LocalStorageConfigurationService(new LocalKeyValueStore(ApplicationConfigurationKeySpace))