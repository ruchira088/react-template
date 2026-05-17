import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { DateTime } from "luxon"

import { None, Some } from "~/types/Option"

vi.mock("~/services/authentication/AuthenticationService", () => ({
  getAuthenticationToken: vi.fn(),
  getAuthenticatedUser: vi.fn(),
}))

import UnauthenticatedLayout from "~/pages/unauthenticated/UnauthenticatedLayout"
import {
  getAuthenticationToken,
  getAuthenticatedUser,
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
        <Route path="/" element={<div>Home</div>} />
        <Route element={<UnauthenticatedLayout />}>
          <Route path="/sign-in" element={<div>Login form</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

describe("UnauthenticatedLayout", () => {
  beforeEach(() => {
    vi.mocked(getAuthenticationToken).mockReset()
    vi.mocked(getAuthenticatedUser).mockReset()
  })

  test("renders Outlet when there is no token", async () => {
    vi.mocked(getAuthenticationToken).mockReturnValue(None.of())

    renderAt("/sign-in")

    expect(await screen.findByText("Login form")).toBeInTheDocument()
    expect(vi.mocked(getAuthenticatedUser)).not.toHaveBeenCalled()
  })

  test("redirects to / when a valid token resolves to a user", async () => {
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(mockToken))
    vi.mocked(getAuthenticatedUser).mockResolvedValue({} as never)

    renderAt("/sign-in")

    await waitFor(() => expect(screen.getByText("Home")).toBeInTheDocument())
  })

  test("stays on the login page when the token is rejected by the API", async () => {
    vi.mocked(getAuthenticationToken).mockReturnValue(Some.of(mockToken))
    vi.mocked(getAuthenticatedUser).mockRejectedValue(new Error("expired"))

    renderAt("/sign-in")

    // Allow the rejected promise to settle.
    await waitFor(() => expect(vi.mocked(getAuthenticatedUser)).toHaveBeenCalled())
    expect(screen.getByText("Login form")).toBeInTheDocument()
  })
})
