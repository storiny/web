import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import CustomState from "./CustomState";
import styles from "./CustomState.module.scss";
import { CustomStateSize } from "./CustomState.props";

describe("<CustomState />", () => {
  it("renders", async () => {
    renderTestWithProvider(<CustomState title={"test"} />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <CustomState title={"test"} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders size `md` by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <CustomState data-testid={"custom-state"} title={"test"} />
    );

    expect(getByTestId("custom-state")).toHaveClass(styles.md);
  });

  (["md", "sm"] as CustomStateSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = renderTestWithProvider(
        <CustomState data-testid={"custom-state"} size={size} title={"test"} />
      );

      expect(getByTestId("custom-state")).toHaveClass(styles[size]);
    });
  });

  it("renders icon", () => {
    const { getByTestId } = renderTestWithProvider(
      <CustomState icon={<span data-testid={"icon"} />} title={"test"} />
    );

    expect(getByTestId("icon")).toBeInTheDocument();
  });

  it("renders description", () => {
    const { getByTestId } = renderTestWithProvider(
      <CustomState
        description={<span data-testid={"description"} />}
        title={"test"}
      />
    );

    expect(getByTestId("description")).toBeInTheDocument();
  });
});
