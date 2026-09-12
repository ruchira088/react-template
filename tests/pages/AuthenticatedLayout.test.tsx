import { describe, expect, test, vi, beforeEach } from "vitest"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router"
import { DateTime } from "luxon"

import { None, Some } from "~/types/Option"

vi.mock("~/services/authentication/AuthenticationService", () => ({
  getAuthenticationToken: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  logout: vi.fn(),
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
  logout,
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
    vi.mocked(logout).mockReset()
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

  test("does not render protected content until the token has been validated", async () => {
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(mockToken))
    let resolveUser: (user: never) => void = () => {}
    vi.mocked(getAuthenticatedUser).mockReturnValue(
      new Promise<never>(resolve => {
        resolveUser = resolve
      })
    )

    renderAt("/dashboard")

    // Validation is still pending: the static header chrome is shown so the
    // page doesn't jump, but nothing behind the auth wall may be visible.
    expect(screen.getByRole("link", { name: /React Template/ })).toBeInTheDocument()
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument()
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument()
    expect(screen.queryByText("Sign out")).not.toBeInTheDocument()

    await act(async () => resolveUser({} as never))

    expect(await screen.findByText("Protected content")).toBeInTheDocument()
  })

  test("removes the token and redirects when getAuthenticatedUser throws", async () => {
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(mockToken))
    vi.mocked(getAuthenticatedUser).mockRejectedValue(new Error("nope"))

    renderAt("/dashboard")

    await waitFor(() => expect(screen.getByText("Sign-in page")).toBeInTheDocument())
    expect(vi.mocked(removeAuthenticationToken)).toHaveBeenCalledOnce()
  })

  test("Sign-out button calls logout, clears the token and navigates to /sign-in", async () => {
    const user = userEvent.setup()
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(mockToken))
    vi.mocked(getAuthenticatedUser).mockResolvedValue({} as never)
    vi.mocked(logout).mockResolvedValue({} as never)

    renderAt("/dashboard")
    await screen.findByText("Protected content")

    await user.click(screen.getByRole("button", { name: "Sign out" }))

    await waitFor(() => expect(screen.getByText("Sign-in page")).toBeInTheDocument())
    expect(vi.mocked(logout)).toHaveBeenCalledOnce()
    expect(vi.mocked(removeAuthenticationToken)).toHaveBeenCalled()
  })

  test("Sign-out still clears the token and navigates when the logout API call fails", async () => {
    const user = userEvent.setup()
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(mockToken))
    vi.mocked(getAuthenticatedUser).mockResolvedValue({} as never)
    vi.mocked(logout).mockRejectedValue(new Error("server unreachable"))
    vi.spyOn(console, "debug").mockImplementation(() => {})

    renderAt("/dashboard")
    await screen.findByText("Protected content")

    await user.click(screen.getByRole("button", { name: "Sign out" }))

    await waitFor(() => expect(screen.getByText("Sign-in page")).toBeInTheDocument())
    expect(vi.mocked(logout)).toHaveBeenCalledOnce()
    expect(vi.mocked(removeAuthenticationToken)).toHaveBeenCalled()
  })
})
