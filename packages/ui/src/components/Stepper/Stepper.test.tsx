import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Stepper from "./Stepper";
import styles from "./Stepper.module.scss";
import { StepperProps, StepperSize } from "./Stepper.props";

describe("<Stepper />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<Stepper totalSteps={3} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Stepper aria-label={"Test stepper"} totalSteps={3} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(
      <Stepper as={"aside"} totalSteps={3} />
    );

    expect(getByRole("progressbar").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders size `md` and `1` active step by default", () => {
    const { getByRole } = renderTestWithProvider(<Stepper totalSteps={3} />);
    const stepper = getByRole("progressbar");

    expect(stepper).toHaveClass(styles.md);
    expect(stepper).toHaveAttribute("data-active", "1");
  });

  it("renders active steps", () => {
    const { getByRole } = renderTestWithProvider(
      <Stepper activeSteps={2} totalSteps={3} />
    );

    expect(getByRole("progressbar")).toHaveAttribute("data-active", "2");
  });

  (["md", "sm"] as StepperSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = renderTestWithProvider(
        <Stepper size={size} totalSteps={3} />
      );

      expect(getByRole("progressbar")).toHaveClass(styles[size]);
    });
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Stepper
        slotProps={
          { step: { "data-testid": "step" } } as StepperProps["slotProps"]
        }
        totalSteps={1}
      />
    );

    expect(getByTestId("step")).toBeInTheDocument();
  });
});
