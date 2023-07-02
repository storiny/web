import { act } from "@testing-library/react";
import React from "react";

import {
  renderHookWithProvider,
  renderTestWithProvider
} from "~/redux/testUtils";

import { useNotification } from "./useNotification";

describe("useNotification", () => {
  it("returns the notification invocation callback", () => {
    const { result } = renderHookWithProvider(() => useNotification());
    expect(result.current).toEqual(expect.any(Function));
  });

  it("renders notification", async () => {
    const { result, unmount } = renderHookWithProvider(
      () => useNotification(),
      {},
      { ignorePrimitiveProviders: false }
    );

    act(() => {
      result.current("Notification message");
    });

    unmount();

    const { getByTestId } = renderTestWithProvider(<span />);
    await getByTestId("notification");
    expect(getByTestId("notification")).toHaveTextContent(
      "Notification message"
    );
  });
});
