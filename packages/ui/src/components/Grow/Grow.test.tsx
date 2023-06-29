import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Grow from "./Grow";

describe("<Grow />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<Grow />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<Grow />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { container } = renderTestWithProvider(<Grow as={"aside"} />);
    expect(container.firstChild?.nodeName.toLowerCase()).toEqual("aside");
  });
});
