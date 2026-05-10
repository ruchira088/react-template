import React from "react"
import { Box, Stack, Typography } from "@mui/material"
import { Link } from "react-router"
import smallLogo from "~/images/small-logo.svg"

// TODO: wire this up to your project's user-creation API. The original
// template assumes a POST /users endpoint that returns the new user, then
// calls AuthenticationService.login(email, password) to seed the token.
const SignupPage = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "2rem" }}>
    <Stack spacing={3} sx={{ width: "100%", maxWidth: 400, alignItems: "center" }}>
      <img src={smallLogo} alt="__PROJECT_TITLE__" style={{ width: 56, height: 56 }} />
      <Typography variant="h5" component="h1">__PROJECT_TITLE__</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center" }}>
        Sign up isn't wired up yet — implement it once your backend has a
        user-creation endpoint.
      </Typography>
      <Typography variant="body2">
        <Link to="/sign-in">Back to sign in</Link>
      </Typography>
    </Stack>
  </Box>
)

export default SignupPage
