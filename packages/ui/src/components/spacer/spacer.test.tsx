import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Spacer from "./spacer";
import styles from "./spacer.module.scss";
import { SpacerOrientation } from "./spacer.props";

describe("<Spacer />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<Spacer />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Spacer />);
    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <Spacer as={"aside"} data-testid={"spacer"} />
    );
    expect(getByTestId("spacer").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders `horizontal` orientation, size `1`, and inline `false` by default", () => {
    const { getByTestId } = render_test_with_provider(
      <Spacer data-testid={"spacer"} />
    );
    const spacer = getByTestId("spacer");

    expect(spacer).toHaveClass(styles.horizontal);
    expect(spacer).not.toHaveClass(styles.inline);
    expect(spacer).toHaveStyle({ "--size": "1" });
  });

  (["horizontal", "vertical"] as SpacerOrientation[]).forEach((orientation) => {
    it(`renders \`${orientation}\` orientation`, () => {
      const { getByTestId } = render_test_with_provider(
        <Spacer data-testid={"spacer"} orientation={orientation} />
      );

      expect(getByTestId("spacer")).toHaveClass(styles[orientation]);
    });
  });

  it("renders inline", () => {
    const { getByTestId } = render_test_with_provider(
      <Spacer data-testid={"spacer"} inline />
    );
    expect(getByTestId("spacer")).toHaveClass(styles.inline);
  });
});
