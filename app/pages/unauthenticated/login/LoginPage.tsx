import React, { type ChangeEvent, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
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
    <div className="flex min-h-screen items-center justify-center p-8">
      <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <img src={smallLogo} alt="React Template" className="h-14 w-14" />
          <h1 className="text-xl font-semibold">React Template</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>
        {import.meta.env.VITE_MOCK_API === "true" && (
          <div className="rounded-md border border-dashed bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Mock API enabled — any email and password will sign you in.
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm">
          Don't have an account? <Link to="/sign-up" className="underline">Sign up</Link>
        </p>
      </form>
    </div>
  )
}

export default LoginPage
