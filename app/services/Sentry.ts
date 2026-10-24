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

// Fraction of transactions sent as performance traces. Production traffic is
// sampled to keep Sentry costs bounded; errors are always reported regardless.
const TRACES_SAMPLE_RATES: Record<Environment, number> = {
  [Environment.Development]: 1.0,
  [Environment.Staging]: 1.0,
  [Environment.Production]: 0.1
}

export const getTracesSampleRate = (environment: Environment): number => TRACES_SAMPLE_RATES[environment]

let sentryInitialized = false

export const initSentry = () => {
  if (sentryInitialized) {
    return
  }

  const environment: Environment = getEnvironment()
  const dsn = DSN_MAPPINGS[environment]
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
    tracesSampleRate: getTracesSampleRate(environment),
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  })
}
