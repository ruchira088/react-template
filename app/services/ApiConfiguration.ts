import { Environment, getEnvironment } from "~/services/Config"

const API_URL_QUERY_PARAMETER = "API_URL"

const API_URL_MAPPINGS: Record<Environment.Staging | Environment.Production, string> = {
  [Environment.Staging]: "api.staging.react-template.ruchij.com",
  [Environment.Production]: "api.react-template.ruchij.com"
}

const inferBaseApiUrl = (): string => {
  const location = window.location
  const queryParams: URLSearchParams = new URLSearchParams(location.search)
  const apiUrlViaQueryParams = queryParams.get(API_URL_QUERY_PARAMETER)

  if (apiUrlViaQueryParams) {
    const url = new URL(location.href)
    url.searchParams.delete(API_URL_QUERY_PARAMETER)
    window.history.replaceState({}, "", url.toString())

    return apiUrlViaQueryParams
  } else {
    const apiUrlViaEnv = import.meta.env.VITE_API_URL

    if (apiUrlViaEnv) {
      return apiUrlViaEnv
    } else {
      const environment = getEnvironment()

      if (environment in API_URL_MAPPINGS) {
        return `${location.protocol}//${API_URL_MAPPINGS[environment as Environment.Staging | Environment.Production]}`
      } else {
        const apiUrl = `${location.protocol}//api.${location.host}`
        return apiUrl
      }
    }
  }
}

export interface ApiConfiguration {
  readonly baseUrl: string
}

export const apiConfiguration: ApiConfiguration = {
  baseUrl: inferBaseApiUrl(),
}
