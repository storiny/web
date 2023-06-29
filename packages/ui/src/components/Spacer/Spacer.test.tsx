import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Spacer from "./Spacer";
import styles from "./Spacer.module.scss";
import { SpacerOrientation } from "./Spacer.props";

describe("<Spacer />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<Spacer />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<Spacer />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Spacer as={"aside"} data-testid={"spacer"} />
    );
    expect(getByTestId("spacer").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders `horizontal` orientation, size `1`, and inline `false` by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <Spacer data-testid={"spacer"} />
    );
    const spacer = getByTestId("spacer");

    expect(spacer).toHaveClass(styles.horizontal);
    expect(spacer).not.toHaveClass(styles.inline);
    expect(spacer).toHaveStyle({ "--size": "1" });
  });

  (["horizontal", "vertical"] as SpacerOrientation[]).forEach((orientation) => {
    it(`renders \`${orientation}\` orientation`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Spacer data-testid={"spacer"} orientation={orientation} />
      );

      expect(getByTestId("spacer")).toHaveClass(styles[orientation]);
    });
  });

  it("renders inline", () => {
    const { getByTestId } = renderTestWithProvider(
      <Spacer data-testid={"spacer"} inline />
    );
    expect(getByTestId("spacer")).toHaveClass(styles.inline);
  });
});
