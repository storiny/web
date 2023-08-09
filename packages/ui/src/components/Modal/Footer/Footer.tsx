"use client";

import clsx from "clsx";
import React from "react";

import styles from "./Footer.module.scss";
import { ModalFooterProps } from "./Footer.props";

const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  (props, ref) => {
    const { compact, children, className, ...rest } = props;
    return (
      <div
        {...rest}
        className={clsx(styles.footer, compact && styles.compact, className)}
        ref={ref}
      >
        {children}
      </div>
    );
  }
);

ModalFooter.displayName = "ModalFooter";

export default ModalFooter;
