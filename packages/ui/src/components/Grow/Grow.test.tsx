import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Grow from "./Grow";

describe("<Grow />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<Grow />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Grow />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { container } = render_test_with_provider(<Grow as={"aside"} />);
    expect(container.firstChild?.nodeName.toLowerCase()).toEqual("aside");
  });
});
