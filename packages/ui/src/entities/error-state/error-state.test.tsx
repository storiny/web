import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import ErrorState from "./error-state";
import styles from "./error-state.module.scss";
import {
  ErrorStateProps,
  ErrorStateSize,
  ErrorStateType
} from "./error-state.props";

describe("<ErrorState />", () => {
  it("renders", () => {
    render_test_with_provider(<ErrorState />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<ErrorState />);
    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders size `md` and type `network` by default", () => {
    const { getByTestId } = render_test_with_provider(
      <ErrorState data-testid={"error-state"} />
    );
    const error_state = getByTestId("error-state");

    expect(error_state).toHaveClass(styles.md);
    expect(error_state).toHaveAttribute("data-error-type", "network");
  });

  (["md", "sm"] as ErrorStateSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = render_test_with_provider(
        <ErrorState data-testid={"error-state"} size={size} />
      );

      expect(getByTestId("error-state")).toHaveClass(styles[size]);
    });
  });

  (["network", "server"] as ErrorStateType[]).forEach((type) => {
    it(`renders \`${type}\` type`, () => {
      const { getByTestId } = render_test_with_provider(
        <ErrorState data-testid={"error-state"} type={type} />
      );

      expect(getByTestId("error-state")).toHaveAttribute(
        "data-error-type",
        type
      );
    });
  });

  it("passes props to the component slots", () => {
    const { getByTestId } = render_test_with_provider(
      <ErrorState
        component_props={
          {
            button: { "data-testid": "retry-button" }
          } as ErrorStateProps["component_props"]
        }
      />
    );

    expect(getByTestId("retry-button")).toBeInTheDocument();
  });
});
