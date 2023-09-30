"use client";

import clsx from "clsx";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./stepper.module.scss";
import { StepperProps } from "./stepper.props";

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

const Stepper = forward_ref<StepperProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    size = "md",
    total_steps,
    active_steps = 1,
    className,
    slot_props,
    ...rest
  } = props;
  return (
    <Component
      {...rest}
      aria-valuemax={total_steps}
      aria-valuemin={0}
      aria-valuenow={active_steps}
      aria-valuetext={`${active_steps} of ${total_steps} ${
        total_steps === 1 ? "step" : "steps"
      } completed`}
      className={clsx("flex-center", styles.stepper, styles[size], className)}
      data-active={active_steps}
      data-total={total_steps}
      ref={ref}
      role={"progressbar"}
    >
      {[...Array(total_steps)].map((_, index) => (
        <Step
          {...slot_props?.step}
          active={index + 1 <= active_steps}
          key={index}
        />
      ))}
    </Component>
  );
});

Stepper.displayName = "Stepper";

export default Stepper;
