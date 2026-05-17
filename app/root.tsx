import React, { type ReactNode, useEffect } from "react"
import { captureException } from "@sentry/react"
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router"
import type { Route } from "./+types/root"
import "./app.css"
import "./index.scss"
import { ApplicationConfigurationProvider } from "~/providers/ApplicationConfigurationProvider"
import smallLogo from "~/images/small-logo.svg"
import { initSentry } from "~/services/Sentry"

export function meta(_args: Route.MetaArgs) {
  return [
    {title: "React Template"},
    {name: "description", content: "React Template"},
  ]
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({children}: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  useEffect(() => {
    initSentry()
  }, [])

  return (
    <ApplicationConfigurationProvider>
      <Outlet />
    </ApplicationConfigurationProvider>
  )
}

export function HydrateFallback() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo-container">
          <img src={smallLogo} alt="React Template" className="loading-logo" />
          <div className="loading-ring"></div>
        </div>
        <h1 className="loading-title">React Template</h1>
        <div className="loading-bar-container">
          <div className="loading-bar"></div>
        </div>
      </div>
    </div>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  captureException(error)

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
