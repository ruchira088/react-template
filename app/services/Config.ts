import { Option } from "~/types/Option"

export enum Environment {
  Development,
  Staging,
  Production
}

const URL_MAPPINGS: Record<Environment.Staging | Environment.Production, string[]> = {
  [Environment.Staging]: ["staging.__SUBDOMAIN__.ruchij.com"],
  [Environment.Production]: ["__SUBDOMAIN__.ruchij.com"]
}

export const getEnvironment = (): Environment => {
  if (typeof window === "undefined") {
    return Environment.Development
  }

  const host: string = window.location.host

  return Option.fromNullable(Object.entries(URL_MAPPINGS).find(([_, hosts]) => hosts.includes(host)))
    .map(([env]) => env as unknown as Environment)
    .getOrElse(() => Environment.Development)
}
