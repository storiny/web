import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";
import { render_test_with_provider } from "src/redux/test-utils";

import AspectRatio from "./aspect-ratio";
import { AspectRatioProps } from "./aspect-ratio.props";

describe("<AspectRatio />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <AspectRatio>
        <div />
      </AspectRatio>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <AspectRatio>
        <div />
      </AspectRatio>
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <AspectRatio as={"aside"} data-testid={"aspect-ratio"}>
        <div />
      </AspectRatio>
    );

    expect(getByTestId("aspect-ratio").nodeName.toLowerCase()).toEqual("aside");
  });

  it("adds `data-first-child` attribute to the first child", () => {
    const { container } = render_test_with_provider(
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
    const { getByTestId } = render_test_with_provider(
      <AspectRatio
        data-testid={"aspect-ratio"}
        slot_props={
          {
            wrapper: { "data-testid": "wrapper" }
          } as AspectRatioProps["slot_props"]
        }
      >
        <div />
      </AspectRatio>
    );

    expect(getByTestId("wrapper")).toBeInTheDocument();
  });
});
