import React, { type FC, useEffect, useState } from "react"
import { None, Option, Some } from "~/types/Option"
import { localStorageConfigurationService } from "~/services/config/ConfigurationService"
import { type ApplicationConfiguration, Theme } from "~/models/ApplicationConfiguration"
import { createTheme, ThemeProvider } from "@mui/material"

export type ApplicationConfigurationContextProps = {
  readonly children?: React.ReactNode;
}

export type ApplicationConfigurationContext = {
  readonly safeMode: boolean;
  readonly theme: Theme;
  readonly setSafeMode: (safeMode: boolean) => void;
  readonly setTheme: (theme: Theme) => void;
}

export const ApplicationConfigurationContext =
  React.createContext<Option<ApplicationConfigurationContext>>(None.of())

export const ApplicationConfigurationProvider: FC<ApplicationConfigurationContextProps> = props => {
  const [applicationConfiguration, setApplicationConfiguration] = useState<Option<ApplicationConfiguration>>(None.of())

  const setSafeMode = (safeMode: boolean) => setApplicationConfiguration((prev) => prev.map(config => ({
    ...config,
    safeMode
  })))

  const setTheme = (theme: Theme) => setApplicationConfiguration((prev) => prev.map(config => ({ ...config, theme })))

  const theme = createTheme({
    colorSchemes: applicationConfiguration.map(({theme}) => ({dark: theme === Theme.Dark})).toDefined()
  })

  useEffect(() => {
    localStorageConfigurationService.getApplicationConfiguration()
      .then(applicationConfiguration =>
        applicationConfiguration.fold<Promise<ApplicationConfiguration>>(
          () => localStorageConfigurationService.getDefaultApplicationConfiguration(),
          appConfig => Promise.resolve(appConfig)
        )
      )
      .then(appConfig => setApplicationConfiguration(Some.of(appConfig)))
  }, [])

  useEffect(() => {
    applicationConfiguration.forEach(appConfig => {
      document.body.setAttribute("data-theme", appConfig.theme)
      localStorageConfigurationService.setApplicationConfiguration(appConfig)
    })
  }, [
    applicationConfiguration.map(({ safeMode }) => safeMode).toNullable(),
    applicationConfiguration.map(({ theme }) => theme).toNullable()
  ])

  if (applicationConfiguration.isEmpty()) {
    return null
  } else {
    return (
      <ApplicationConfigurationContext.Provider
        value={applicationConfiguration.map(config => ({ ...config, setSafeMode, setTheme }))}>
        <ThemeProvider theme={theme}>
          {props.children}
        </ThemeProvider>
      </ApplicationConfigurationContext.Provider>
    )
  }
}

export const useApplicationConfiguration = (): ApplicationConfigurationContext => {
  const applicationConfigurationContext = React.useContext(ApplicationConfigurationContext)

  if (applicationConfigurationContext == null) {
    throw new Error("useApplicationConfiguration must be used within an ApplicationConfigurationProvider")
  }

  return applicationConfigurationContext.getOrElse(() => {
      throw new Error("ApplicationConfigurationContext is not initialized")
    }
  )
}