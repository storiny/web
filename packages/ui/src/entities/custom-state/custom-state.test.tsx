import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import CustomState from "./custom-state";
import styles from "./custom-state.module.scss";
import { CustomStateSize } from "./custom-state.props";

describe("<CustomState />", () => {
  it("renders", () => {
    render_test_with_provider(<CustomState title={"test"} />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <CustomState title={"test"} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders size `md` by default", () => {
    const { getByTestId } = render_test_with_provider(
      <CustomState data-testid={"custom-state"} title={"test"} />
    );

    expect(getByTestId("custom-state")).toHaveClass(styles.md);
  });

  (["md", "sm"] as CustomStateSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = render_test_with_provider(
        <CustomState data-testid={"custom-state"} size={size} title={"test"} />
      );

      expect(getByTestId("custom-state")).toHaveClass(styles[size]);
    });
  });

  it("renders icon", () => {
    const { getByTestId } = render_test_with_provider(
      <CustomState icon={<span data-testid={"icon"} />} title={"test"} />
    );

    expect(getByTestId("icon")).toBeInTheDocument();
  });

  it("renders description", () => {
    const { getByTestId } = render_test_with_provider(
      <CustomState
        description={<span data-testid={"description"} />}
        title={"test"}
      />
    );

    expect(getByTestId("description")).toBeInTheDocument();
  });
});
