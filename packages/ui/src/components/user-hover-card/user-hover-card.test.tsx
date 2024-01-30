import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import UserHoverCard from "./user-hover-card";
import styles from "./user-hover-card.module.scss";
import { StepperSize, UserHoverCardProps } from "./user-hover-card.props";

describe("<Stepper />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <UserHoverCard total_steps={3} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <UserHoverCard aria-label={"Test stepper"} total_steps={3} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <UserHoverCard as={"aside"} total_steps={3} />
    );

    expect(getByRole("progressbar").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders size `md` and `1` active step by default", () => {
    const { getByRole } = render_test_with_provider(
      <UserHoverCard total_steps={3} />
    );
    const stepper = getByRole("progressbar");

    expect(stepper).toHaveClass(styles.md);
    expect(stepper).toHaveAttribute("data-active", "1");
  });

  it("renders active steps", () => {
    const { getByRole } = render_test_with_provider(
      <UserHoverCard active_steps={2} total_steps={3} />
    );

    expect(getByRole("progressbar")).toHaveAttribute("data-active", "2");
  });

  (["md", "sm"] as StepperSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = render_test_with_provider(
        <UserHoverCard size={size} total_steps={3} />
      );

      expect(getByRole("progressbar")).toHaveClass(styles[size]);
    });
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <UserHoverCard
        slot_props={
          {
            step: { "data-testid": "step" }
          } as UserHoverCardProps["slot_props"]
        }
        total_steps={1}
      />
    );

    expect(getByTestId("step")).toBeInTheDocument();
  });
});
