import { copyToClipboard } from "./copyToClipboard";

describe("copyToClipboard", () => {
  const initialClipboard = { ...global.navigator.clipboard };

  beforeEach(() => {
    // Mock legacy execCommand method
    document.execCommand = jest.fn();

    // Mock the navigator
    Object.defineProperty(global, "navigator", {
      value: {
        clipboard: {
          writeText: jest.fn().mockImplementationOnce(() => Promise.resolve()),
        },
      },
      configurable: true,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();

    // Restore clipboard
    Object.defineProperty(global, "navigator", {
      value: {
        clipboard: initialClipboard,
      },
      configurable: true,
    });
  });

  it("copies text to the clipboard", async () => {
    await copyToClipboard("test");
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test");
  });

  it("copies text to the clipboard when `navigator.clipboard` is not available", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });

    await copyToClipboard("test");
    expect(document.execCommand).toHaveBeenCalledTimes(1);
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });
});
