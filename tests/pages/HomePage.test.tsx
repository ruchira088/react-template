import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"

import HomePage from "~/pages/authenticated/HomePage"

describe("HomePage", () => {
  test("renders the welcome heading", () => {
    render(<HomePage />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Hello, React Template/i)
  })

  test("points the user at the file to edit", () => {
    render(<HomePage />)
    expect(screen.getByText(/HomePage\.tsx/)).toBeInTheDocument()
  })
})
