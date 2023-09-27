import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Stepper from "./Stepper";
import styles from "./Stepper.module.scss";
import { StepperProps, StepperSize } from "./Stepper.props";

describe("<Stepper />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<Stepper totalSteps={3} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Stepper aria-label={"Test stepper"} totalSteps={3} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <Stepper as={"aside"} totalSteps={3} />
    );

    expect(getByRole("progressbar").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders size `md` and `1` active step by default", () => {
    const { getByRole } = render_test_with_provider(<Stepper totalSteps={3} />);
    const stepper = getByRole("progressbar");

    expect(stepper).toHaveClass(styles.md);
    expect(stepper).toHaveAttribute("data-active", "1");
  });

  it("renders active steps", () => {
    const { getByRole } = render_test_with_provider(
      <Stepper activeSteps={2} totalSteps={3} />
    );

    expect(getByRole("progressbar")).toHaveAttribute("data-active", "2");
  });

  (["md", "sm"] as StepperSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = render_test_with_provider(
        <Stepper size={size} totalSteps={3} />
      );

      expect(getByRole("progressbar")).toHaveClass(styles[size]);
    });
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Stepper
        slot_props={
          { step: { "data-testid": "step" } } as StepperProps["slot_props"]
        }
        totalSteps={1}
      />
    );

    expect(getByTestId("step")).toBeInTheDocument();
  });
});
