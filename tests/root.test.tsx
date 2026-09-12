import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { renderToStaticMarkup } from "react-dom/server"
import { createRoutesStub, MemoryRouter, Route, Routes } from "react-router"

vi.mock("@sentry/react", () => ({
  captureException: vi.fn(),
}))

vi.mock("~/services/Sentry", () => ({
  initSentry: vi.fn(),
}))

import { captureException } from "@sentry/react"
import { initSentry } from "~/services/Sentry"
import App, { ErrorBoundary, HydrateFallback, Layout, links, meta } from "~/root"

// Shape recognised by react-router's isRouteErrorResponse().
const routeError = (status: number, statusText: string) => ({
  status,
  statusText,
  internal: false,
  data: null,
})

const renderErrorBoundary = (error: unknown) =>
  render(<ErrorBoundary error={error} params={{}} />)

describe("root", () => {
  beforeEach(() => {
    vi.mocked(captureException).mockReset()
    vi.mocked(initSentry).mockReset()
  })

  describe("meta", () => {
    test("sets the page title and description", () => {
      expect(meta({} as never)).toEqual(
        expect.arrayContaining([{ title: "React Template" }, { name: "description", content: "React Template" }])
      )
    })
  })

  describe("links", () => {
    test("preconnects to Google Fonts and loads the Inter stylesheet", () => {
      const result = links()

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ rel: "preconnect", href: "https://fonts.googleapis.com" }),
          expect.objectContaining({ rel: "stylesheet", href: expect.stringContaining("family=Inter") }),
        ])
      )
    })
  })

  describe("Layout", () => {
    test("renders the document shell with children inside the body", () => {
      const Stub = createRoutesStub([
        {
          path: "/",
          Component: () => (
            <Layout>
              <div>page content</div>
            </Layout>
          ),
        },
      ])

      const html = renderToStaticMarkup(<Stub initialEntries={["/"]} />)

      expect(html).toMatch(/^<html lang="en">/)
      expect(html).toContain('<meta charSet="utf-8"/>')
      expect(html).toContain("<div>page content</div>")
    })
  })

  describe("HydrateFallback", () => {
    test("renders the loading screen with the app name", () => {
      render(<HydrateFallback />)

      expect(screen.getByRole("heading", { name: "React Template" })).toBeInTheDocument()
      expect(screen.getByRole("img", { name: "React Template" })).toBeInTheDocument()
    })
  })

  describe("App", () => {
    test("initialises Sentry and renders the matched child route", async () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route element={<App />}>
              <Route index element={<div>child route</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      expect(await screen.findByText("child route")).toBeInTheDocument()
      expect(vi.mocked(initSentry)).toHaveBeenCalledOnce()
    })
  })

  describe("ErrorBoundary", () => {
    test("renders a not-found message for a 404 route error", () => {
      renderErrorBoundary(routeError(404, "Not Found"))

      expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument()
      expect(screen.getByText("The requested page could not be found.")).toBeInTheDocument()
    })

    test("renders the status text for other route errors", () => {
      renderErrorBoundary(routeError(503, "Service Unavailable"))

      expect(screen.getByRole("heading", { name: "Error" })).toBeInTheDocument()
      expect(screen.getByText("Service Unavailable")).toBeInTheDocument()
    })

    test("falls back to the generic message when a route error has no status text", () => {
      renderErrorBoundary(routeError(500, ""))

      expect(screen.getByRole("heading", { name: "Error" })).toBeInTheDocument()
      expect(screen.getByText("An unexpected error occurred.")).toBeInTheDocument()
    })

    test("shows the message and stack for thrown Errors in development", () => {
      const error = new Error("boom")
      error.stack = "Error: boom\n    at somewhere.ts:1:1"

      renderErrorBoundary(error)

      expect(screen.getByRole("heading", { name: "Oops!" })).toBeInTheDocument()
      expect(screen.getByText("boom")).toBeInTheDocument()
      expect(screen.getByText(/at somewhere\.ts:1:1/)).toBeInTheDocument()
    })

    test("shows the generic message for unknown thrown values", () => {
      renderErrorBoundary("a string, not an Error")

      expect(screen.getByRole("heading", { name: "Oops!" })).toBeInTheDocument()
      expect(screen.getByText("An unexpected error occurred.")).toBeInTheDocument()
      expect(screen.queryByRole("code")).not.toBeInTheDocument()
    })

    test("reports the error to Sentry", () => {
      const error = new Error("boom")

      renderErrorBoundary(error)

      expect(vi.mocked(captureException)).toHaveBeenCalledWith(error)
    })

    test("reports the same error only once across re-renders", () => {
      const error = new Error("boom")

      const { rerender } = renderErrorBoundary(error)
      rerender(<ErrorBoundary error={error} params={{}} />)
      rerender(<ErrorBoundary error={error} params={{}} />)

      expect(vi.mocked(captureException)).toHaveBeenCalledOnce()
    })
  })
})
