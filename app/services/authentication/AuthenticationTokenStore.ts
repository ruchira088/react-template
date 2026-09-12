import { AuthenticationToken } from "~/models/AuthenticationToken"
import { type KeySpace, LocalKeyValueStore } from "~/services/kv-store/KeyValueStore"
import type { Option } from "~/types/Option"
import { zodParse } from "~/types/Zod"

// Owns the persisted auth token and nothing else. Kept separate from
// AuthenticationService so HttpClient's 401 interceptor can clear the token
// without importing the service that itself imports HttpClient.

const AuthenticationKey = "Token" as const

const AuthenticationKeySpace: KeySpace<typeof AuthenticationKey, AuthenticationToken> = {
  name: "Authentication",

  keyEncoder: {
    encode(authenticationKey: typeof AuthenticationKey): string {
      return authenticationKey.toString()
    },
  },

  valueCodec: {
    decode(value: string): AuthenticationToken {
      return zodParse(AuthenticationToken, JSON.parse(value))
    },

    encode(authenticationToken: AuthenticationToken): string {
      return JSON.stringify(authenticationToken)
    },
  },
}

const authenticationKeyValueStore = new LocalKeyValueStore(AuthenticationKeySpace)

export const getAuthenticationToken = (): Option<AuthenticationToken> =>
  authenticationKeyValueStore.get(AuthenticationKey)

export const setAuthenticationToken = (authenticationToken: AuthenticationToken): void =>
  authenticationKeyValueStore.put(AuthenticationKey, authenticationToken)

export const removeAuthenticationToken = (): Option<AuthenticationToken> =>
  authenticationKeyValueStore.remove(AuthenticationKey)
