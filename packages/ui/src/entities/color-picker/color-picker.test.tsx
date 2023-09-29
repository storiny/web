import { axe } from "@storiny/test-utils";
import { screen, waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import ColorPicker from "./core/components/color-picker";

describe("<ColorPicker />", () => {
  it("renders", () => {
    render_test_with_provider(<ColorPicker />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<ColorPicker />);
    await wait_for(async () =>
      expect(
        await axe(container, {
          rules: {
            "aria-allowed-role": {
              enabled: false
            }
          }
        })
      ).toHaveNoViolations()
    );
  });

  it("renders with pre-defined value", async () => {
    const { getByTestId } = render_test_with_provider(
      <ColorPicker
        default_value={{
          h: 223,
          s: 21,
          v: 13,
          a: 100,
          r: 27,
          g: 29,
          b: 34,
          hex: "1B1D22",
          str: "#1B1D22"
        }}
      />
    );

    const input = await screen.findByRole("textbox", { name: /color value/i });
    expect(input).toHaveValue("#1B1D22");

    // Thumbs
    expect(getByTestId("color-board-thumb")).toHaveStyle({
      "--color": "#1B1D22"
    });

    expect(getByTestId("alpha-thumb")).toHaveStyle({
      "--color": "#1B1D22"
    });

    expect(getByTestId("hue-thumb")).toHaveStyle({
      "--color": "#0048ff"
    });
  });
});
