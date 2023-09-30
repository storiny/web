import { render_hook_with_provider } from "~/redux/test-utils";

import { use_active_cursor } from "./use-active-cursor";

describe("use_active_cursor", () => {
  it("adds cursor style to body when the element gets active", () => {
    const { result } = render_hook_with_provider(() =>
      use_active_cursor("grabbing")
    );
    const { on_pointer_down, on_pointer_up } = result.current;

    expect(document.body).toHaveStyle({ cursor: "" });
    on_pointer_down();
    expect(document.body).toHaveStyle({ cursor: "grabbing" });

    on_pointer_up();
    expect(document.body).toHaveStyle({ cursor: "" });
  });
});
