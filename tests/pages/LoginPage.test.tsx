import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router"

vi.mock("~/services/authentication/AuthenticationService", () => ({
  login: vi.fn(),
  REDIRECT_QUERY_PARAMETER: "redirect",
}))

import LoginPage from "~/pages/unauthenticated/login/LoginPage"
import { login } from "~/services/authentication/AuthenticationService"

const renderAt = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/sign-in" element={<LoginPage />} />
        <Route path="/" element={<div>Home</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/sign-up" element={<div>Signup</div>} />
      </Routes>
    </MemoryRouter>
  )

describe("LoginPage", () => {
  beforeEach(() => {
    vi.mocked(login).mockReset()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test("requires both email and password before calling login", async () => {
    const user = userEvent.setup()
    renderAt("/sign-in")

    await user.click(screen.getByRole("button", { name: /Sign in/i }))

    expect(await screen.findByText(/Email and password are required/i)).toBeInTheDocument()
    expect(vi.mocked(login)).not.toHaveBeenCalled()
  })

  test("calls login and navigates to / when no redirect is set", async () => {
    const user = userEvent.setup()
    vi.mocked(login).mockResolvedValue({} as never)

    renderAt("/sign-in")

    await user.type(screen.getByLabelText("Email"), "alice@example.com")
    await user.type(screen.getByLabelText("Password"), "hunter2")
    await user.click(screen.getByRole("button", { name: /Sign in/i }))

    await waitFor(() => expect(vi.mocked(login)).toHaveBeenCalledWith("alice@example.com", "hunter2"))
    await waitFor(() => expect(screen.getByText("Home")).toBeInTheDocument())
  })

  test("honours the ?redirect= query parameter", async () => {
    const user = userEvent.setup()
    vi.mocked(login).mockResolvedValue({} as never)

    renderAt("/sign-in?redirect=/dashboard")

    await user.type(screen.getByLabelText("Email"), "a@b.c")
    await user.type(screen.getByLabelText("Password"), "pw")
    await user.click(screen.getByRole("button", { name: /Sign in/i }))

    await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument())
  })

  test("surfaces login errors and re-enables the submit button", async () => {
    const user = userEvent.setup()
    vi.mocked(login).mockRejectedValue(new Error("Bad credentials"))

    renderAt("/sign-in")

    await user.type(screen.getByLabelText("Email"), "a@b.c")
    await user.type(screen.getByLabelText("Password"), "pw")
    await user.click(screen.getByRole("button", { name: /Sign in/i }))

    expect(await screen.findByText("Bad credentials")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Sign in/i })).toBeEnabled()
  })

  test("shows the mock-API banner only when VITE_MOCK_API=true", async () => {
    vi.stubEnv("VITE_MOCK_API", "true")
    renderAt("/sign-in")
    expect(screen.getByText(/Mock API enabled/i)).toBeInTheDocument()
  })

  test("hides the mock-API banner when VITE_MOCK_API is unset", async () => {
    vi.stubEnv("VITE_MOCK_API", "")
    renderAt("/sign-in")
    expect(screen.queryByText(/Mock API enabled/i)).not.toBeInTheDocument()
  })
})
