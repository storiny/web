import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import ErrorState from "./ErrorState";
import styles from "./ErrorState.module.scss";
import {
  ErrorStateProps,
  ErrorStateSize,
  ErrorStateType
} from "./ErrorState.props";

describe("<ErrorState />", () => {
  it("renders", async () => {
    renderTestWithProvider(<ErrorState />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<ErrorState />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders size `md` and type `network` by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <ErrorState data-testid={"error-state"} />
    );
    const errorState = getByTestId("error-state");

    expect(errorState).toHaveClass(styles.md);
    expect(errorState).toHaveAttribute("data-error-type", "network");
  });

  (["md", "sm"] as ErrorStateSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = renderTestWithProvider(
        <ErrorState data-testid={"error-state"} size={size} />
      );

      expect(getByTestId("error-state")).toHaveClass(styles[size]);
    });
  });

  (["network", "server"] as ErrorStateType[]).forEach((type) => {
    it(`renders \`${type}\` type`, () => {
      const { getByTestId } = renderTestWithProvider(
        <ErrorState data-testid={"error-state"} type={type} />
      );

      expect(getByTestId("error-state")).toHaveAttribute(
        "data-error-type",
        type
      );
    });
  });

  it("passes props to the component slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <ErrorState
        componentProps={
          {
            button: { "data-testid": "retry-button" }
          } as ErrorStateProps["componentProps"]
        }
      />
    );

    expect(getByTestId("retry-button")).toBeInTheDocument();
  });
});
