import { act } from "@testing-library/react";
import React from "react";

import {
  renderHookWithProvider,
  renderTestWithProvider
} from "~/redux/testUtils";

import { useToast } from "./useToast";

describe("useToast", () => {
  it("returns the toast invocation callback", () => {
    const { result } = renderHookWithProvider(() => useToast());
    expect(result.current).toEqual(expect.any(Function));
  });

  it("renders toast", async () => {
    const { result, unmount } = renderHookWithProvider(
      () => useToast(),
      {},
      { ignorePrimitiveProviders: false }
    );

    act(() => {
      result.current("Toast message");
    });

    unmount();

    const { getByTestId } = renderTestWithProvider(<span />);
    await getByTestId("toast");
    expect(getByTestId("toast")).toHaveTextContent("Toast message");
  });
});
