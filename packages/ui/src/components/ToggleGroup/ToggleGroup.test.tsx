import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import toggleStyles from "../common/Toggle.module.scss";
import ToggleGroupItem from "../ToggleGroupItem";
import ToggleGroup from "./ToggleGroup";
import { ToggleGroupOrientation, ToggleGroupSize } from "./ToggleGroup.props";

describe("<ToggleGroup />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<ToggleGroup />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <ToggleGroup>
        <ToggleGroupItem value={"test"}>Test</ToggleGroupItem>
      </ToggleGroup>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <ToggleGroup as={"aside"}>
        <ToggleGroupItem value={"test"} />
      </ToggleGroup>
    );

    expect(getByRole("group").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders orientation `horizontal` and size `md` by default", () => {
    const { getByRole } = render_test_with_provider(
      <ToggleGroup>
        <ToggleGroupItem value={"test"} />
      </ToggleGroup>
    );

    expect(getByRole("radio")).toHaveClass(toggleStyles.md);
    expect(getByRole("group")).toHaveAttribute(
      "data-orientation",
      "horizontal"
    );
  });

  (["horizontal", "vertical"] as ToggleGroupOrientation[]).forEach(
    (orientation) => {
      it(`renders \`${orientation}\` orientation`, () => {
        const { getByRole } = render_test_with_provider(
          <ToggleGroup orientation={orientation} />
        );

        expect(getByRole("group")).toHaveAttribute(
          "data-orientation",
          orientation
        );
      });
    }
  );

  (["lg", "md", "sm", "xs"] as ToggleGroupSize[]).forEach((size) => {
    it(`passes \`${size}\` size to the context`, () => {
      const { getByRole } = render_test_with_provider(
        <ToggleGroup size={size}>
          <ToggleGroupItem value={"test"} />
        </ToggleGroup>
      );

      expect(getByRole("radio")).toHaveClass(toggleStyles[size]);
    });
  });
});
