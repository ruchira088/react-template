export const REDIRECT_QUERY_PARAMETER = "redirect"

const DEFAULT_REDIRECT = "/"

type RedirectLocation = {
  readonly pathname: string
  readonly search: string
  readonly hash: string
}

// The sign-in URL that brings the user back to `location` once they've signed in.
export const signInPath = ({ pathname, search, hash }: RedirectLocation): string =>
  `/sign-in?${new URLSearchParams({ [REDIRECT_QUERY_PARAMETER]: pathname + search + hash })}`

// The ?redirect= value arrives from the URL, so anyone can craft it. Only
// same-origin paths may be followed after sign-in; anything else falls back
// to DEFAULT_REDIRECT.
// Resolving with the URL parser, rather than matching strings, means browser
// quirks (`/\host`, tabs/newlines stripped into `//host`) are judged exactly
// as the browser would navigate them.
export const safeRedirectPath = (redirect: string | null): string => {
  if (redirect == null || !redirect.startsWith("/")) {
    return DEFAULT_REDIRECT
  }

  const url = new URL(redirect, window.location.origin)

  return url.origin === window.location.origin ? url.pathname + url.search + url.hash : DEFAULT_REDIRECT
}
