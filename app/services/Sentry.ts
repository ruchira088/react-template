import * as Sentry from "@sentry/react"
import { Environment, getEnvironment } from "~/services/Config"

// TODO: Replace these placeholder DSNs with the real values from
// https://sentry.io after creating a project. Leave empty strings for
// environments where you don't want Sentry initialised.
const DSN_MAPPINGS: Record<Environment, string> = {
  [Environment.Development]: "",
  [Environment.Staging]: "",
  [Environment.Production]: ""
}

const getDsn = () => {
  const environment: Environment = getEnvironment()
  return DSN_MAPPINGS[environment]
}

let sentryInitialized = false

export const initSentry = () => {
  if (sentryInitialized) {
    return
  }

  const dsn = getDsn()
  if (!dsn) {
    return
  }

  sentryInitialized = true

  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration()
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  })
}
