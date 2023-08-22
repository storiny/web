import "@testing-library/jest-dom";
import "expect-more-jest";
import "whatwg-fetch";

import { act } from "@testing-library/react";
import { toHaveNoViolations } from "jest-axe";

export { default as userEvent } from "@testing-library/user-event";
export { axe } from "jest-axe";

expect.extend(toHaveNoViolations);

// Wait for popper's position
export const waitForPosition = (): Promise<void> => act(async () => {});

// Mock fetch
global.fetch = jest.fn();

// Polyfill resize observer
global.ResizeObserver = require("resize-observer-polyfill");

// Mock scrollIntoView (not available in jsdom yet)
window.HTMLElement.prototype.scrollIntoView = (): void => {};

// Mock `matchMedia`
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Safari < 14
    removeListener: jest.fn(), // Safari < 14
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock `localStorage`
Storage.prototype.setItem = jest.fn();
Storage.prototype.getItem = jest.fn();

// Mock `nanoid`
jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "test-id")
}));

// Mock next.js navigation utilities
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
  useSelectedLayoutSegment: jest.fn(),
  useSelectedLayoutSegments: jest.fn()
}));

// Intersection observer mock
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});

window.IntersectionObserver = mockIntersectionObserver;
