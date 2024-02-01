import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import PlusPattern from "./plus-pattern";

describe("<PlusPattern />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<PlusPattern />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<PlusPattern />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
