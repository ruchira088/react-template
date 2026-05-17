import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router"
import { DateTime } from "luxon"

import { None, Some } from "~/types/Option"

vi.mock("~/services/authentication/AuthenticationService", () => ({
  getAuthenticationToken: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  removeAuthenticationToken: vi.fn(),
  REDIRECT_QUERY_PARAMETER: "redirect",
}))

vi.mock("~/components/ThemeToggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}))

import AuthenticatedLayout from "~/pages/authenticated/AuthenticatedLayout"
import {
  getAuthenticationToken,
  getAuthenticatedUser,
  removeAuthenticationToken,
} from "~/services/authentication/AuthenticationService"

const mockToken = {
  secret: "test",
  issuedAt: DateTime.fromISO("2026-01-01T00:00:00Z"),
  expiresAt: DateTime.fromISO("2026-12-31T00:00:00Z"),
  renewals: 0,
}

const renderAt = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/sign-in" element={<div>Sign-in page</div>} />
        <Route element={<AuthenticatedLayout />}>
          <Route path="/dashboard" element={<div>Protected content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

describe("AuthenticatedLayout", () => {
  beforeEach(() => {
    vi.mocked(getAuthenticationToken).mockReset()
    vi.mocked(getAuthenticatedUser).mockReset()
    vi.mocked(removeAuthenticationToken).mockReset()
  })

  test("redirects to /sign-in with the current path when no token exists", async () => {
    vi.mocked(getAuthenticationToken).mockReturnValue(None.of())

    renderAt("/dashboard")

    await waitFor(() => expect(screen.getByText("Sign-in page")).toBeInTheDocument())
    // The header should NOT have rendered since we redirected away.
    expect(screen.queryByText("Sign out")).not.toBeInTheDocument()
  })

  test("renders the Outlet + header when authenticated", async () => {
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(mockToken))
    vi.mocked(getAuthenticatedUser).mockResolvedValue({} as never)

    renderAt("/dashboard")

    expect(await screen.findByText("Protected content")).toBeInTheDocument()
    expect(screen.getByText("Sign out")).toBeInTheDocument()
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument()
  })

  test("removes the token and redirects when getAuthenticatedUser throws", async () => {
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(mockToken))
    vi.mocked(getAuthenticatedUser).mockRejectedValue(new Error("nope"))

    renderAt("/dashboard")

    await waitFor(() => expect(screen.getByText("Sign-in page")).toBeInTheDocument())
    expect(vi.mocked(removeAuthenticationToken)).toHaveBeenCalledOnce()
  })

  test("Sign-out button clears the token and navigates to /sign-in", async () => {
    const user = userEvent.setup()
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(mockToken))
    vi.mocked(getAuthenticatedUser).mockResolvedValue({} as never)

    renderAt("/dashboard")
    await screen.findByText("Protected content")

    await user.click(screen.getByRole("button", { name: "Sign out" }))

    await waitFor(() => expect(screen.getByText("Sign-in page")).toBeInTheDocument())
    expect(vi.mocked(removeAuthenticationToken)).toHaveBeenCalled()
  })
})
