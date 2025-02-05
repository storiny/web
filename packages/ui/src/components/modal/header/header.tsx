"use client";

import clsx from "clsx";
import { Dialog } from "radix-ui";
import React from "react";

import css from "~/theme/main.module.scss";

import Spacer from "../../spacer";
import styles from "./header.module.scss";
import { ModalHeaderProps } from "./header.props";

const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  (props, ref) => {
    const { decorator, className, children, slot_props, ...rest } = props;
    return (
      <div
        {...rest}
        className={clsx(css["flex-center"], styles.header, className)}
        ref={ref}
      >
        <Spacer size={1.5} />
        {decorator && (
          <>
            <span
              {...slot_props?.decorator}
              className={clsx(
                css["flex-center"],
                styles.decorator,
                slot_props?.decorator?.className
              )}
            >
              {decorator}
            </span>
            <Spacer size={0.5} />
          </>
        )}
        <Dialog.Title
          {...slot_props?.title}
          className={clsx(
            css["t-body-2"],
            css["t-major"],
            styles.title,
            slot_props?.title?.className
          )}
        >
          {children}
        </Dialog.Title>
      </div>
    );
  }
);

ModalHeader.displayName = "ModalHeader";

export default ModalHeader;
