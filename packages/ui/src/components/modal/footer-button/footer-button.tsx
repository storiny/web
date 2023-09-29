"use client";

import { Close } from "@radix-ui/react-dialog";
import React from "react";

import { ModalFooterButtonProps } from "src/components/modal";

import Button from "../../button";

const ModalFooterButton = React.forwardRef<
  HTMLButtonElement,
  ModalFooterButtonProps
>(({ compact, size, style, ...rest }, ref) => (
  <Close asChild>
    <Button
      {...rest}
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
