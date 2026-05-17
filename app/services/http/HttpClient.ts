import axios, { type AxiosInstance } from "axios"
import { apiConfiguration } from "~/services/ApiConfiguration"
import { removeAuthenticationToken } from "../authentication/AuthenticationService"
import { mockApiAdapter } from "./MockApi"

const isMockApiEnabled = import.meta.env.VITE_MOCK_API === "true"

export const axiosClient: AxiosInstance = axios.create({
  baseURL: apiConfiguration.baseUrl,
  withCredentials: true,
  ...(isMockApiEnabled ? { adapter: mockApiAdapter } : {})
})

if (isMockApiEnabled) {
  console.info("[mock-api] VITE_MOCK_API=true — auth endpoints are served from MockApi.ts")
}

axiosClient.interceptors.response.use(
  (value) => Promise.resolve(value),
  (error) => {
    if (error.response?.status === 401) {
      console.debug("Received 401 status response. Removing authentication token and redirecting to sign-in page.")
      removeAuthenticationToken()
    }
    return Promise.reject(error)
  }
)
