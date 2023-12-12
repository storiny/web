import { act } from "@testing-library/react";

import { use_toast } from "~/components/toast";
import { render_hook_with_provider } from "~/redux/test-utils";

import { use_web_share } from "./use-web-share";

describe("use_web_share", () => {
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
    const { result } = render_hook_with_provider(() => {
      const toast = use_toast();
      return use_web_share(toast);
    });

    act(() => {
      result.current(data.text, data.url);
    });

    expect(navigator.share).toHaveBeenCalledTimes(1);
    expect(navigator.share).toHaveBeenCalledWith({ ...data, title: "Storiny" });
  });
});
