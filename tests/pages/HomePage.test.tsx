import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Outlet, Route, Routes } from "react-router"
import { DateTime } from "luxon"

import HomePage from "~/pages/authenticated/HomePage"
import { Role, type User } from "~/models/User"

const user: User = {
  id: "user-1",
  createdAt: DateTime.fromISO("2026-01-01T00:00:00Z"),
  firstName: "Alice",
  lastName: "Smith",
  email: "alice@example.com",
  role: Role.User
}

// Stands in for AuthenticatedLayout, which hands the validated user down.
const renderHomePage = () =>
  render(
    <MemoryRouter>
      <Routes>
        <Route element={<Outlet context={user} />}>
          <Route index element={<HomePage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

describe("HomePage", () => {
  test("greets the signed-in user by first name", () => {
    renderHomePage()
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hello, Alice")
  })

  test("points the user at the file to edit", () => {
    renderHomePage()
    expect(screen.getByText(/HomePage\.tsx/)).toBeInTheDocument()
  })
})
