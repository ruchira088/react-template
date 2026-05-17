import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"

describe("Button", () => {
  test("renders a <button> with default variant + size classes", () => {
    render(<Button>Click me</Button>)

    const button = screen.getByRole("button", { name: "Click me" })
    expect(button.tagName).toBe("BUTTON")
    expect(button.className).toContain("bg-primary")
    expect(button.className).toContain("h-9")
  })

  test("applies destructive variant classes", () => {
    render(<Button variant="destructive">Delete</Button>)

    expect(screen.getByRole("button").className).toContain("bg-destructive")
  })

  test("applies icon size", () => {
    render(<Button size="icon" aria-label="icon-only">x</Button>)

    expect(screen.getByRole("button", { name: "icon-only" }).className).toContain("size-9")
  })

  test("merges caller className with the variant defaults", () => {
    render(<Button className="custom-class">x</Button>)

    expect(screen.getByRole("button").className).toContain("custom-class")
  })

  test("asChild renders the child element instead of a <button>", () => {
    render(
      <Button asChild>
        <a href="/somewhere">go</a>
      </Button>
    )

    const link = screen.getByRole("link", { name: "go" })
    expect(link.tagName).toBe("A")
    expect(link.className).toContain("bg-primary")
  })

  test("disabled buttons do not fire onClick", async () => {
    const user = userEvent.setup()
    let calls = 0
    render(<Button disabled onClick={() => calls++}>x</Button>)

    await user.click(screen.getByRole("button"))
    expect(calls).toBe(0)
  })
})

describe("Input", () => {
  test("renders a text input by default with shadcn classes", () => {
    render(<Input placeholder="email" />)
    const input = screen.getByPlaceholderText("email") as HTMLInputElement

    expect(input.tagName).toBe("INPUT")
    expect(input.type).toBe("text")
    expect(input.className).toContain("border-input")
  })

  test("respects type prop", () => {
    render(<Input type="password" placeholder="password" />)
    expect((screen.getByPlaceholderText("password") as HTMLInputElement).type).toBe("password")
  })

  test("forwards user typing", async () => {
    const user = userEvent.setup()
    let value = ""
    render(<Input placeholder="x" onChange={(e) => (value = e.target.value)} />)

    await user.type(screen.getByPlaceholderText("x"), "abc")
    expect(value).toBe("abc")
  })
})

describe("Label", () => {
  test("renders a <label> linked via htmlFor", () => {
    render(
      <>
        <Label htmlFor="field">Name</Label>
        <Input id="field" />
      </>
    )

    const label = screen.getByText("Name") as HTMLLabelElement
    expect(label.tagName).toBe("LABEL")
    expect(label.htmlFor).toBe("field")
  })
})
