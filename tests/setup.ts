import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver with configurable callback
// Store callbacks so tests can trigger intersection events
export const intersectionObserverCallbacks: IntersectionObserverCallback[] = []

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string = ""
  readonly scrollMargin: string = ""
  readonly thresholds: readonly number[] = []
  private callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    intersectionObserverCallbacks.push(callback)
  }

  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn().mockReturnValue([])

  // Helper for tests to trigger intersection
  trigger(entries: Partial<IntersectionObserverEntry>[]) {
    this.callback(entries as IntersectionObserverEntry[], this)
  }
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: MockResizeObserver,
})
