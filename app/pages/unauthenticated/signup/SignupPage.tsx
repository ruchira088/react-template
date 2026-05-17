import React from "react"
import { Link } from "react-router"
import smallLogo from "~/images/small-logo.svg"

// TODO: wire this up to your project's user-creation API. The original
// template assumes a POST /users endpoint that returns the new user, then
// calls AuthenticationService.login(email, password) to seed the token.
const SignupPage = () => (
  <div className="flex min-h-screen items-center justify-center p-8">
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <img src={smallLogo} alt="__PROJECT_TITLE__" className="h-14 w-14" />
      <h1 className="text-xl font-semibold">__PROJECT_TITLE__</h1>
      <p className="text-center text-muted-foreground">
        Sign up isn't wired up yet — implement it once your backend has a
        user-creation endpoint.
      </p>
      <p className="text-sm">
        <Link to="/sign-in" className="underline">Back to sign in</Link>
      </p>
    </div>
  </div>
)

export default SignupPage
