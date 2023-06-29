import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Slider from "./Slider";
import { SliderOrientation, SliderProps } from "./Slider.props";

describe("<Slider />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<Slider />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Slider
        slotProps={{
          thumb: { "aria-label": "Test slider" },
        }}
      />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Slider as={"aside"} data-testid={"slider"} />
    );

    expect(getByTestId("slider").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders with horizontal orientation by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <Slider data-testid={"slider"} />
    );

    expect(getByTestId("slider")).toHaveAttribute(
      "data-orientation",
      "horizontal"
    );
  });

  (["horizontal", "vertical"] as SliderOrientation[]).forEach((orientation) => {
    it(`renders \`${orientation}\` orientation`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Slider data-testid={"slider"} orientation={orientation} />
      );

      expect(getByTestId("slider")).toHaveAttribute(
        "data-orientation",
        orientation
      );
    });
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Slider
        slotProps={
          {
            range: { "data-testid": "range" },
            thumb: { "data-testid": "thumb" },
            track: { "data-testid": "track" },
          } as SliderProps["slotProps"]
        }
      />
    );

    ["range", "thumb", "track"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
