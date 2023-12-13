import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Slider from "./slider";
import { SliderOrientation, SliderProps } from "./slider.props";

describe("<Slider />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<Slider />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Slider
        slot_props={{
          thumb: { "aria-label": "Test slider" }
        }}
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <Slider as={"aside"} data-testid={"slider"} />
    );

    expect(getByTestId("slider").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders with horizontal orientation by default", () => {
    const { getByTestId } = render_test_with_provider(
      <Slider data-testid={"slider"} />
    );

    expect(getByTestId("slider")).toHaveAttribute(
      "data-orientation",
      "horizontal"
    );
  });

  (["horizontal", "vertical"] as SliderOrientation[]).forEach((orientation) => {
    it(`renders \`${orientation}\` orientation`, () => {
      const { getByTestId } = render_test_with_provider(
        <Slider data-testid={"slider"} orientation={orientation} />
      );

      expect(getByTestId("slider")).toHaveAttribute(
        "data-orientation",
        orientation
      );
    });
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Slider
        slot_props={
          {
            range: { "data-testid": "range" },
            thumb: { "data-testid": "thumb" },
            track: { "data-testid": "track" }
          } as SliderProps["slot_props"]
        }
      />
    );

    ["range", "thumb", "track"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
