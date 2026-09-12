import { Link, Outlet, useNavigate } from "react-router"
import React, { useEffect, useState } from "react"
import { Button } from "~/components/ui/button"
import { ThemeToggle } from "~/components/ThemeToggle"
import type { AuthenticationToken } from "~/models/AuthenticationToken"
import {
  getAuthenticatedUser,
  getAuthenticationToken,
  logout,
  REDIRECT_QUERY_PARAMETER,
  removeAuthenticationToken
} from "~/services/authentication/AuthenticationService"
import smallLogo from "~/images/small-logo.svg"
import type { Option } from "~/types/Option"

const AuthenticatedLayout = () => {
  const navigate = useNavigate()
  // Nothing behind the auth wall renders until the stored token has been
  // validated against the API, so a stale token never flashes protected content.
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    const maybeToken: Option<AuthenticationToken> = getAuthenticationToken()

    const redirectUrl = `/sign-in?${REDIRECT_QUERY_PARAMETER}=${window.location.pathname}`

    maybeToken.fold(
      () => {
        console.debug("Redirecting to sign-in page.")
        navigate(redirectUrl)
      },
      async _ => {
        try {
          await getAuthenticatedUser()
          setIsAuthenticated(true)
        } catch {
          removeAuthenticationToken()
          console.debug("Removing authentication token and redirecting to sign-in page.")
          navigate(redirectUrl)
        }
      }
    )
  }

  const signOut = async () => {
    try {
      await logout()
    } catch (error) {
      // The server session may already be gone; the local token is cleared regardless.
      console.debug("Logout request failed; clearing local token anyway.", error)
    } finally {
      removeAuthenticationToken()
      navigate("/sign-in")
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      <header className="flex items-center justify-between border-b px-6 py-3">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <img src={smallLogo} alt="React Template" className="h-8 w-8" />
          <span className="text-lg font-semibold">React Template</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>
      <Outlet />
    </>
  )
}

export default AuthenticatedLayout
