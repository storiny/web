import { render_hook_with_provider } from "src/redux/test-utils";

import { useActiveCursor } from "./useActiveCursor";

describe("useActiveCursor", () => {
  it("adds cursor style to body when the element gets active", () => {
    const { result } = render_hook_with_provider(() =>
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
