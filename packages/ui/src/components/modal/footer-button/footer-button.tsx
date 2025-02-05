"use client";

import clsx from "clsx";
import { Dialog } from "radix-ui";
import React from "react";

import { ModalFooterButtonProps } from "~/components/modal";
import css from "~/theme/main.module.scss";

import Button from "../../button";

const ModalFooterButton = React.forwardRef<
  HTMLButtonElement,
  ModalFooterButtonProps
>(({ compact, className, size, style, ...rest }, ref) => (
  <Dialog.Close asChild>
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
  </Dialog.Close>
));

ModalFooterButton.displayName = "ModalFooterButton";

export default ModalFooterButton;
