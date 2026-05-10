import { Link, Outlet, useNavigate } from "react-router"
import React, { useEffect } from "react"
import { Box, Typography, Button } from "@mui/material"
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
      <Box
        component="header"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1.5rem",
          borderBottom: "1px solid",
          borderColor: "divider"
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", gap: "0.5rem" }}>
          <img src={smallLogo} alt="__PROJECT_TITLE__" style={{ width: 32, height: 32 }} />
          <Typography variant="h6" component="span">__PROJECT_TITLE__</Typography>
        </Link>
        <Button
          variant="text"
          onClick={() => {
            removeAuthenticationToken()
            navigate("/sign-in")
          }}
        >
          Sign out
        </Button>
      </Box>
      <Outlet />
    </>
  )
}

export default AuthenticatedLayout
