import { act } from "@testing-library/react";

import { renderHookWithProvider } from "~/redux/testUtils";

import { useClipboard } from "./useClipboard";

describe("useClipboard", () => {
  const initialClipboard = { ...global.navigator.clipboard };

  beforeEach(() => {
    // Mock the navigator
    Object.defineProperty(global, "navigator", {
      value: {
        clipboard: {
          writeText: jest.fn().mockImplementationOnce(() => Promise.resolve())
        }
      },
      configurable: true
    });
  });

  afterEach(() => {
    jest.resetAllMocks();

    // Restore clipboard
    Object.defineProperty(global, "navigator", {
      value: {
        clipboard: initialClipboard
      },
      configurable: true
    });
  });

  it("copies text to the clipboard", async () => {
    const { result } = renderHookWithProvider(() => useClipboard());

    await act(async () => {
      await result.current("test");
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test");
  });
});
