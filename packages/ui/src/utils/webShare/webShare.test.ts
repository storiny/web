import { webShare } from "./webShare";

describe("webShare", () => {
  beforeEach(() => {
    // Mock the web share api
    Object.defineProperty(global, "navigator", {
      value: {
        share: jest.fn().mockImplementationOnce(() => Promise.resolve()),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("calls the web share api", async () => {
    const data = { text: "test", url: "https://storiny.com" };

    await webShare(data);
    expect(navigator.share).toHaveBeenCalledTimes(1);
    expect(navigator.share).toHaveBeenCalledWith({ ...data, title: "Storiny" });
  });

  it("copies text to clipboard when web share api is not available", async () => {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });

    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: jest.fn().mockImplementationOnce(() => Promise.resolve()),
      },
      configurable: true,
    });

    await webShare({ text: "test", url: "https://storiny.com" });
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://storiny.com"
    );
  });
});
