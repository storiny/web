import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import ColorPicker from "./ColorPicker";

describe("<ColorPicker />", () => {
  it("renders", () => {
    renderTestWithProvider(<ColorPicker />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<ColorPicker />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
