import { axiosClient } from "~/services/http/HttpClient"
import { AuthenticationToken } from "~/models/AuthenticationToken"
import { type KeySpace, LocalKeyValueStore } from "~/services/kv-store/KeyValueStore"
import { User } from "~/models/User"
import type { Option } from "~/types/Option"
import { zodParse } from "~/types/Zod"

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

export const REDIRECT_QUERY_PARAMETER = "redirect"

export const getAuthenticationToken = (): Option<AuthenticationToken> =>
  authenticationKeyValueStore.get(AuthenticationKey)

export const login = async (email: string, password: string): Promise<AuthenticationToken> => {
  const response = await axiosClient.post("/authentication/login", { email, password })
  const authenticationToken = zodParse(AuthenticationToken, response.data)

  authenticationKeyValueStore.put(AuthenticationKey, authenticationToken)

  return authenticationToken
}

export const getAuthenticatedUser = async (): Promise<User> => {
  const response = await axiosClient.get("/authentication/user")
  const user = zodParse(User, response.data)

  return user
}

export const logout = async (): Promise<User> => {
  const response = await axiosClient.delete("authentication/logout")
  removeAuthenticationToken()

  const user = zodParse(User, response.data)

  return user
}

export const removeAuthenticationToken = (): Option<AuthenticationToken> =>
  authenticationKeyValueStore.remove(AuthenticationKey)
