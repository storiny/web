"use client";

import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./Stepper.module.scss";
import { StepperProps } from "./Stepper.props";

const Step = ({
  className,
  active,
  ...rest
}: React.ComponentPropsWithoutRef<"span"> & {
  active?: boolean;
}): React.ReactElement => (
  <span
    {...rest}
    className={clsx(styles.step, active && styles.active, className)}
  />
);

const Stepper = forwardRef<StepperProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    size = "md",
    totalSteps,
    activeSteps = 1,
    className,
    slot_props,
    ...rest
  } = props;

  return (
    <Component
      {...rest}
      aria-valuemax={totalSteps}
      aria-valuemin={0}
      aria-valuenow={activeSteps}
      aria-valuetext={`${activeSteps} of ${totalSteps} ${
        totalSteps === 1 ? "step" : "steps"
      } completed`}
      className={clsx("flex-center", styles.stepper, styles[size], className)}
      data-active={activeSteps}
      data-total={totalSteps}
      ref={ref}
      role={"progressbar"}
    >
      {[...Array(totalSteps)].map((_, index) => (
        <Step
          {...slot_props?.step}
          active={index + 1 <= activeSteps}
          key={index}
        />
      ))}
    </Component>
  );
});

Stepper.displayName = "Stepper";

export default Stepper;
