"use client";

import { Close } from "@radix-ui/react-dialog";
import clsx from "clsx";
import React from "react";

import { ModalFooterButtonProps } from "~/components/modal";
import css from "~/theme/main.module.scss";

import Button from "../../button";

const ModalFooterButton = React.forwardRef<
  HTMLButtonElement,
  ModalFooterButtonProps
>(({ compact, className, size, style, ...rest }, ref) => (
  <Close asChild>
    <Button
      {...rest}
      className={clsx(compact && css["focus-invert"], className)}
      ref={ref}
      size={compact ? "lg" : size}
      {...(compact
        ? // eslint-disable-next-line prefer-snakecase/prefer-snakecase
          { style: { ...style, borderRadius: 0, flex: 1 } }
        : { style })}
    />
  </Close>
));

ModalFooterButton.displayName = "ModalFooterButton";

export default ModalFooterButton;
