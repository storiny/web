import "@testing-library/jest-dom";
import "expect-more-jest";
import "whatwg-fetch";

import { act } from "@testing-library/react";
import { toHaveNoViolations as to_have_no_violations } from "jest-axe";

export { default as user_event } from "@testing-library/user-event";
export { axe } from "jest-axe";

expect.extend(to_have_no_violations);

// Wait for popper's position
export const wait_for_position = (): Promise<void> =>
  act(async () => undefined);

// Mock fetch
global.fetch = jest.fn();

// Polyfill resize observer
global.ResizeObserver = require("resize-observer-polyfill");

// Mock scrollIntoView (not available in jsdom yet)
window.HTMLElement.prototype.scrollIntoView = (): void => undefined;

// Mock `matchMedia`

/* eslint-disable prefer-snakecase/prefer-snakecase */
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
/* eslint-enable prefer-snakecase/prefer-snakecase */

// Mock `localStorage`
Storage.prototype.setItem = jest.fn();
Storage.prototype.getItem = jest.fn();

// Mock `nanoid`
jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "test-id")
}));

// Mock next.js navigation utilities
/* eslint-disable prefer-snakecase/prefer-snakecase */
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
  useSelectedLayoutSegment: jest.fn(),
  useSelectedLayoutSegments: jest.fn()
}));
/* eslint-enable prefer-snakecase/prefer-snakecase */

// Intersection observer mock
const mock_intersection_observer = jest.fn();
mock_intersection_observer.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});

window.IntersectionObserver = mock_intersection_observer;
