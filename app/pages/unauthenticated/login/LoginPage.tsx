import React, { type ChangeEvent, useState } from "react"
import { Box, Button, Stack, TextField, Typography } from "@mui/material"
import { Link, useNavigate, useSearchParams } from "react-router"
import { Option } from "~/types/Option"
import { login, REDIRECT_QUERY_PARAMETER } from "~/services/authentication/AuthenticationService"
import smallLogo from "~/images/small-logo.svg"

const LoginPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.")
      return
    }

    setIsSubmitting(true)
    try {
      await login(email, password)

      const redirect = Option.fromNullable(searchParams.get(REDIRECT_QUERY_PARAMETER))
        .getOrElse(() => "/")

      navigate(redirect)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "2rem" }}>
      <Box component="form" onSubmit={onSubmit} sx={{ width: "100%", maxWidth: 400 }}>
        <Stack spacing={3}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <img src={smallLogo} alt="__PROJECT_TITLE__" style={{ width: 56, height: 56 }} />
            <Typography variant="h5" component="h1">__PROJECT_TITLE__</Typography>
            <Typography variant="body2" color="text.secondary">Sign in to your account</Typography>
          </Box>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
            fullWidth
            autoComplete="email"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
            fullWidth
            autoComplete="current-password"
          />
          {error && <Typography color="error" variant="body2">{error}</Typography>}
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
          <Typography variant="body2" sx={{ textAlign: "center" }}>
            Don't have an account? <Link to="/sign-up">Sign up</Link>
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}

export default LoginPage
