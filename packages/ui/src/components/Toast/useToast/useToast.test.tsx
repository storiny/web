import { act } from "@testing-library/react";
import React from "react";

import {
  render_hook_with_provider,
  render_test_with_provider
} from "src/redux/test-utils";

import { useToast } from "./useToast";

describe("useToast", () => {
  it("returns the toast invocation callback", () => {
    const { result } = render_hook_with_provider(() => useToast());
    expect(result.current).toEqual(expect.any(Function));
  });

  it("renders toast", async () => {
    const { result, unmount } = render_hook_with_provider(
      () => useToast(),
      {},
      { ignorePrimitiveProviders: false }
    );

    act(() => {
      result.current("Toast message");
    });

    unmount();

    const { getByTestId } = render_test_with_provider(<span />);
    await getByTestId("toast");
    expect(getByTestId("toast")).toHaveTextContent("Toast message");
  });
});
