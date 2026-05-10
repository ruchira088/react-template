import React, { useEffect } from "react"
import { Outlet, useNavigate } from "react-router"
import { getAuthenticatedUser, getAuthenticationToken } from "~/services/authentication/AuthenticationService"
import type { AuthenticationToken } from "~/models/AuthenticationToken"
import type { Option } from "~/types/Option"

const UnauthenticatedLayout = () => {
  const navigate = useNavigate()

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = () => {
    const token: Option<AuthenticationToken> = getAuthenticationToken()

    token.forEach(async () => {
      try {
        await getAuthenticatedUser()
        navigate("/")
      } catch {
        // User not authenticated, stay on login page
      }
    })
  }

  return <Outlet />
}

export default UnauthenticatedLayout