import { renderHookWithProvider } from "~/redux/testUtils";

import { useActiveCursor } from "./useActiveCursor";

describe("useActiveCursor", () => {
  it("adds cursor style to body when the element gets active", () => {
    const { result } = renderHookWithProvider(() =>
      useActiveCursor("grabbing")
    );

    const { onPointerUp, onPointerDown } = result.current;

    expect(document.body).toHaveStyle({ cursor: "" });

    onPointerDown();
    expect(document.body).toHaveStyle({ cursor: "grabbing" });

    onPointerUp();
    expect(document.body).toHaveStyle({ cursor: "" });
  });
});
