import { act } from "@testing-library/react";
import React from "react";

import {
  renderHookWithProvider,
  renderTestWithProvider
} from "~/redux/testUtils";

import { useBanner } from "./useBanner";

describe("useBanner", () => {
  it("returns the banner invocation callback", () => {
    const { result } = renderHookWithProvider(() => useBanner());
    expect(result.current).toEqual(expect.any(Function));
  });

  it("renders banner", async () => {
    const { result, unmount } = renderHookWithProvider(
      () => useBanner(),
      {},
      { ignorePrimitiveProviders: false }
    );

    act(() => {
      result.current("Banner message");
    });

    unmount();

    const { getByTestId } = renderTestWithProvider(<span />);
    await getByTestId("banner");
    expect(getByTestId("banner")).toHaveTextContent("Banner message");
  });
});
