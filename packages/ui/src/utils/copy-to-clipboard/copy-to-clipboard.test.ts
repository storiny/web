import { copy_to_clipboard } from "./copy-to-clipboard";

describe("copy_to_clipboard", () => {
  const initial_clipboard = { ...global.navigator.clipboard };

  beforeEach(() => {
    // Mock legacy execCommand method
    document.execCommand = jest.fn();

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
    await copy_to_clipboard("test");
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test");
  });

  it("copies text to the clipboard when `navigator.clipboard` is not available", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true
    });

    await copy_to_clipboard("test");
    expect(document.execCommand).toHaveBeenCalledTimes(1);
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });
});
