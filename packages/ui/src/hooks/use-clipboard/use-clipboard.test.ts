import { render_hook_with_provider } from "~/redux/test-utils";

import { use_clipboard } from "./use-clipboard";

describe("use_clipboard", () => {
  const initial_clipboard = { ...global.navigator.clipboard };

  beforeEach(() => {
    // Mock the navigator
    Object.defineProperty(global, "navigator", {
      value: {
        clipboard: {
          // eslint-disable-next-line prefer-snakecase/prefer-snakecase
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
        clipboard: initial_clipboard
      },
      configurable: true
    });
  });

  it("copies text to the clipboard", async () => {
    const { result } = render_hook_with_provider(() => use_clipboard());

    await result.current("test");

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test");
  });
});
