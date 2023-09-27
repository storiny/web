import { act } from "@testing-library/react";

import { render_hook_with_provider } from "src/redux/test-utils";

import { useWebShare } from "./useWebShare";

describe("useWebShare", () => {
  beforeEach(() => {
    // Mock the web share api
    Object.defineProperty(global, "navigator", {
      value: {
        share: jest.fn().mockImplementationOnce(() => Promise.resolve())
      },
      configurable: true
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("calls the web share api", async () => {
    const data = { text: "test", url: "https://storiny.com" };
    const { result } = render_hook_with_provider(() => useWebShare());

    await act(async () => {
      await result.current(data.text, data.url);
    });

    expect(navigator.share).toHaveBeenCalledTimes(1);
    expect(navigator.share).toHaveBeenCalledWith({ ...data, title: "Storiny" });
  });
});
