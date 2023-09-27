"use client";

import { Title } from "@radix-ui/react-dialog";
import clsx from "clsx";
import React from "react";

import Spacer from "../../Spacer";
import styles from "./Header.module.scss";
import { ModalHeaderProps } from "./Header.props";

const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  (props, ref) => {
    const { decorator, className, children, slot_props, ...rest } = props;

    return (
      <div
        {...rest}
        className={clsx("flex-center", styles.header, className)}
        ref={ref}
      >
        <Spacer size={1.5} />
        {decorator && (
          <>
            <span
              {...slot_props?.decorator}
              className={clsx(
                "flex-center",
                styles.decorator,
                slot_props?.decorator?.className
              )}
            >
              {decorator}
            </span>
            <Spacer size={0.5} />
          </>
        )}
        <Title
          {...slot_props?.title}
          className={clsx(
            "t-body-2",
            "t-major",
            styles.title,
            slot_props?.title?.className
          )}
        >
          {children}
        </Title>
      </div>
    );
  }
);

ModalHeader.displayName = "ModalHeader";

export default ModalHeader;
