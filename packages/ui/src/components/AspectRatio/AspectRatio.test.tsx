import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import AspectRatio from "./AspectRatio";
import { AspectRatioProps } from "./AspectRatio.props";

describe("<AspectRatio />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <AspectRatio>
        <div />
      </AspectRatio>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <AspectRatio>
        <div />
      </AspectRatio>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <AspectRatio as={"aside"} data-testid={"aspect-ratio"}>
        <div />
      </AspectRatio>
    );

    expect(getByTestId("aspect-ratio").nodeName.toLowerCase()).toEqual("aside");
  });

  it("adds `data-first-child` attribute to the first child", () => {
    const { container } = renderTestWithProvider(
      <AspectRatio>
        <div>First</div>
        <div>Second</div>
        <div>Third</div>
      </AspectRatio>
    );

    expect(container.querySelector("[data-first-child]")).toHaveTextContent(
      /^First$/
    );
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <AspectRatio
        data-testid={"aspect-ratio"}
        slotProps={
          {
            wrapper: { "data-testid": "wrapper" },
          } as AspectRatioProps["slotProps"]
        }
      >
        <div />
      </AspectRatio>
    );

    expect(getByTestId("wrapper")).toBeInTheDocument();
  });
});
