import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Status from "./status";

describe("<Status />", () => {
  it("renders", () => {
    render_test_with_provider(<Status user_id={""} />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Status disable_modal user_id={""} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
