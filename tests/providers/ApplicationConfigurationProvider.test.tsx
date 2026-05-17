import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const getApplicationConfiguration = vi.fn()
const setApplicationConfiguration = vi.fn()
const getDefaultApplicationConfiguration = vi.fn()

vi.mock("~/services/config/ConfigurationService", () => ({
  localStorageConfigurationService: {
    getApplicationConfiguration: () => getApplicationConfiguration(),
    setApplicationConfiguration: (config: unknown) => setApplicationConfiguration(config),
    getDefaultApplicationConfiguration: () => getDefaultApplicationConfiguration(),
  },
}))

import { None, Some } from "~/types/Option"
import { Theme } from "~/models/ApplicationConfiguration"
import {
  ApplicationConfigurationProvider,
  useApplicationConfiguration,
} from "~/providers/ApplicationConfigurationProvider"
import { ThemeToggle } from "~/components/ThemeToggle"

const Observer = () => {
  const ctx = useApplicationConfiguration()
  return (
    <div>
      <span data-testid="theme">{ctx.theme}</span>
      <span data-testid="safe-mode">{String(ctx.safeMode)}</span>
      <button onClick={() => ctx.setTheme(Theme.Light)}>force-light</button>
      <button onClick={() => ctx.setSafeMode(true)}>enable-safe</button>
    </div>
  )
}

describe("ApplicationConfigurationProvider", () => {
  beforeEach(() => {
    getApplicationConfiguration.mockReset()
    setApplicationConfiguration.mockReset()
    getDefaultApplicationConfiguration.mockReset()
    document.documentElement.classList.remove("dark")
    document.body.removeAttribute("data-theme")
  })

  afterEach(() => {
    document.documentElement.classList.remove("dark")
    document.body.removeAttribute("data-theme")
  })

  test("falls back to the default config when no saved config exists", async () => {
    getApplicationConfiguration.mockResolvedValue(None.of())
    getDefaultApplicationConfiguration.mockResolvedValue({ theme: Theme.Light, safeMode: false })

    render(
      <ApplicationConfigurationProvider>
        <Observer />
      </ApplicationConfigurationProvider>
    )

    await waitFor(() => expect(screen.getByTestId("theme")).toHaveTextContent(Theme.Light))
    expect(screen.getByTestId("safe-mode")).toHaveTextContent("false")
    expect(document.body.getAttribute("data-theme")).toBe(Theme.Light)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(getDefaultApplicationConfiguration).toHaveBeenCalledOnce()
  })

  test("uses the persisted config when present and applies .dark for dark theme", async () => {
    getApplicationConfiguration.mockResolvedValue(Some.of({ theme: Theme.Dark, safeMode: true }))

    render(
      <ApplicationConfigurationProvider>
        <Observer />
      </ApplicationConfigurationProvider>
    )

    await waitFor(() => expect(screen.getByTestId("theme")).toHaveTextContent(Theme.Dark))
    expect(screen.getByTestId("safe-mode")).toHaveTextContent("true")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(document.body.getAttribute("data-theme")).toBe(Theme.Dark)
    expect(getDefaultApplicationConfiguration).not.toHaveBeenCalled()
  })

  test("setTheme persists and removes the .dark class when switched back to light", async () => {
    const user = userEvent.setup()
    getApplicationConfiguration.mockResolvedValue(Some.of({ theme: Theme.Dark, safeMode: false }))
    setApplicationConfiguration.mockResolvedValue(undefined)

    render(
      <ApplicationConfigurationProvider>
        <Observer />
      </ApplicationConfigurationProvider>
    )

    await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(true))

    await user.click(screen.getByRole("button", { name: "force-light" }))

    await waitFor(() => expect(screen.getByTestId("theme")).toHaveTextContent(Theme.Light))
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(setApplicationConfiguration).toHaveBeenLastCalledWith({ theme: Theme.Light, safeMode: false })
  })

  test("setSafeMode updates state and persists", async () => {
    const user = userEvent.setup()
    getApplicationConfiguration.mockResolvedValue(Some.of({ theme: Theme.Light, safeMode: false }))
    setApplicationConfiguration.mockResolvedValue(undefined)

    render(
      <ApplicationConfigurationProvider>
        <Observer />
      </ApplicationConfigurationProvider>
    )

    await waitFor(() => expect(screen.getByTestId("safe-mode")).toHaveTextContent("false"))
    await user.click(screen.getByRole("button", { name: "enable-safe" }))

    await waitFor(() => expect(screen.getByTestId("safe-mode")).toHaveTextContent("true"))
    expect(setApplicationConfiguration).toHaveBeenLastCalledWith({ theme: Theme.Light, safeMode: true })
  })

  test("useApplicationConfiguration throws when the context has no value", () => {
    // The provider's default context value is None, so reading from it
    // outside a populated provider trips the getOrElse safety throw.
    expect(() => render(<Observer />)).toThrow(
      /ApplicationConfigurationContext is not initialized/
    )
  })
})

describe("ThemeToggle", () => {
  beforeEach(() => {
    getApplicationConfiguration.mockReset()
    setApplicationConfiguration.mockReset()
    document.documentElement.classList.remove("dark")
    document.body.removeAttribute("data-theme")
  })

  test("flips Light -> Dark and shows the appropriate icon", async () => {
    const user = userEvent.setup()
    getApplicationConfiguration.mockResolvedValue(Some.of({ theme: Theme.Light, safeMode: false }))
    setApplicationConfiguration.mockResolvedValue(undefined)

    render(
      <ApplicationConfigurationProvider>
        <ThemeToggle />
      </ApplicationConfigurationProvider>
    )

    const button = await screen.findByRole("button", { name: /Switch to dark theme/i })
    await user.click(button)

    await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(true))
    expect(screen.getByRole("button", { name: /Switch to light theme/i })).toBeInTheDocument()
  })
})
