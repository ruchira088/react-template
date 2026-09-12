import { axiosClient } from "~/services/http/HttpClient"
import { AuthenticationToken } from "~/models/AuthenticationToken"
import {
  getAuthenticationToken,
  removeAuthenticationToken,
  setAuthenticationToken
} from "~/services/authentication/AuthenticationTokenStore"
import { User } from "~/models/User"
import { zodParse } from "~/types/Zod"

export { getAuthenticationToken, removeAuthenticationToken }

export const REDIRECT_QUERY_PARAMETER = "redirect"

export const login = async (email: string, password: string): Promise<AuthenticationToken> => {
  const response = await axiosClient.post("/authentication/login", { email, password })
  const authenticationToken = zodParse(AuthenticationToken, response.data)

  setAuthenticationToken(authenticationToken)

  return authenticationToken
}

export const getAuthenticatedUser = async (): Promise<User> => {
  const response = await axiosClient.get("/authentication/user")
  const user = zodParse(User, response.data)

  return user
}

export const logout = async (): Promise<User> => {
  const response = await axiosClient.delete("/authentication/logout")
  removeAuthenticationToken()

  const user = zodParse(User, response.data)

  return user
}
