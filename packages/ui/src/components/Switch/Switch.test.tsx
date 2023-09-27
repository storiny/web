import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Switch from "./Switch";
import styles from "./Switch.module.scss";
import { SwitchColor, SwitchProps, SwitchSize } from "./Switch.props";

describe("<Switch />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<Switch />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Switch aria-label={"Test switch"} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(<Switch as={"aside"} />);
    expect(getByRole("switch").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders with size `md` and color `inverted` by default", () => {
    const { getByRole } = render_test_with_provider(<Switch />);
    expect(getByRole("switch")).toHaveClass(...[styles.md, styles.inverted]);
  });

  (["inverted", "ruby"] as SwitchColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByRole } = render_test_with_provider(<Switch color={color} />);
      expect(getByRole("switch")).toHaveClass(styles[color]);
    });
  });

  (["md", "sm"] as SwitchSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = render_test_with_provider(<Switch size={size} />);
      expect(getByRole("switch")).toHaveClass(styles[size]);
    });
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Switch
        slot_props={
          {
            thumb: { "data-testid": "thumb" },
            barIndicator: { "data-testid": "bar-indicator" },
            ringIndicator: { "data-testid": "ring-indicator" }
          } as SwitchProps["slot_props"]
        }
      />
    );

    ["thumb", "bar-indicator", "ring-indicator"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
