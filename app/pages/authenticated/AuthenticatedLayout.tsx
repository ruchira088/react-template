import { Link, Outlet, useNavigate } from "react-router"
import React, { useEffect } from "react"
import { Button } from "~/components/ui/button"
import { ThemeToggle } from "~/components/ThemeToggle"
import type { AuthenticationToken } from "~/models/AuthenticationToken"
import {
  getAuthenticatedUser,
  getAuthenticationToken,
  REDIRECT_QUERY_PARAMETER,
  removeAuthenticationToken
} from "~/services/authentication/AuthenticationService"
import smallLogo from "~/images/small-logo.svg"
import type { Option } from "~/types/Option"

const AuthenticatedLayout = () => {
  const navigate = useNavigate()

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
        } catch {
          removeAuthenticationToken()
          console.debug("Removing authentication token and redirecting to sign-in page.")
          navigate(redirectUrl)
        }
      }
    )
  }

  return (
    <>
      <header className="flex items-center justify-between border-b px-6 py-3">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <img src={smallLogo} alt="__PROJECT_TITLE__" className="h-8 w-8" />
          <span className="text-lg font-semibold">__PROJECT_TITLE__</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            onClick={() => {
              removeAuthenticationToken()
              navigate("/sign-in")
            }}
          >
            Sign out
          </Button>
        </div>
      </header>
      <Outlet />
    </>
  )
}

export default AuthenticatedLayout
