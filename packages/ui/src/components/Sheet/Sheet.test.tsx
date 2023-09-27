import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Sheet from "./Sheet";
import styles from "./Sheet.module.scss";
import { SheetVariant } from "./Sheet.props";

describe("<Sheet />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<Sheet />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Sheet />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <Sheet as={"aside"} data-testid={"sheet"} />
    );
    expect(getByTestId("sheet").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders variant `outlined` by default", () => {
    const { getByTestId } = render_test_with_provider(
      <Sheet data-testid={"sheet"} />
    );
    expect(getByTestId("sheet")).toHaveClass(styles.outlined);
  });

  (["plain", "outlined", "elevated"] as SheetVariant[]).forEach((variant) => {
    it(`renders \`${variant}\` variant`, () => {
      const { getByTestId } = render_test_with_provider(
        <Sheet data-testid={"sheet"} variant={variant} />
      );

      expect(getByTestId("sheet")).toHaveClass(styles[variant]);
    });
  });
});
