import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"

import SignupPage from "~/pages/unauthenticated/signup/SignupPage"

describe("SignupPage", () => {
  test("renders the stub copy and a link back to sign in", () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("React Template")
    expect(screen.getByText(/Sign up isn't wired up yet/i)).toBeInTheDocument()

    const link = screen.getByRole("link", { name: /Back to sign in/i }) as HTMLAnchorElement
    expect(link.getAttribute("href")).toBe("/sign-in")
  })
})
