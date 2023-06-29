import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Switch from "./Switch";
import styles from "./Switch.module.scss";
import { SwitchColor, SwitchProps, SwitchSize } from "./Switch.props";

describe("<Switch />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<Switch />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Switch aria-label={"Test switch"} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(<Switch as={"aside"} />);
    expect(getByRole("switch").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders with size `md` and color `inverted` by default", () => {
    const { getByRole } = renderTestWithProvider(<Switch />);
    expect(getByRole("switch")).toHaveClass(...[styles.md, styles.inverted]);
  });

  (["inverted", "ruby"] as SwitchColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByRole } = renderTestWithProvider(<Switch color={color} />);
      expect(getByRole("switch")).toHaveClass(styles[color]);
    });
  });

  (["md", "sm"] as SwitchSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = renderTestWithProvider(<Switch size={size} />);
      expect(getByRole("switch")).toHaveClass(styles[size]);
    });
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Switch
        slotProps={
          {
            thumb: { "data-testid": "thumb" },
            barIndicator: { "data-testid": "bar-indicator" },
            ringIndicator: { "data-testid": "ring-indicator" },
          } as SwitchProps["slotProps"]
        }
      />
    );

    ["thumb", "bar-indicator", "ring-indicator"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
