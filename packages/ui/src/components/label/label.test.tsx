import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Label from "./label";

describe("<Label />", () => {
  it("matches snapshot", () => {
    const { container, getByTestId } = render_test_with_provider(
      <fieldset>
        <Label data-testid={"label"} htmlFor={"sample"} />
        <input id={"sample"} placeholder={"Sample input"} />
      </fieldset>
    );

    expect(getByTestId("label")).toHaveAttribute("data-disabled", "false");
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <fieldset>
        <Label htmlFor={"sample"} />
        <input id={"sample"} placeholder={"Sample input"} />
      </fieldset>
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders with `disabled` prop", () => {
    const { getByTestId } = render_test_with_provider(
      <fieldset>
        <Label data-testid={"label"} disabled htmlFor={"sample"} />
        <input disabled id={"sample"} placeholder={"Sample input"} />
      </fieldset>
    );

    expect(getByTestId("label")).toHaveAttribute("data-disabled", "true");
  });
});
