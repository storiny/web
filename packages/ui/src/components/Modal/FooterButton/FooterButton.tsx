"use client";

import { Close } from "@radix-ui/react-dialog";
import React from "react";

import { ModalFooterButtonProps } from "~/components/Modal";

import Button from "../../Button";

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
        ? { style: { ...style, borderRadius: 0, flex: 1 } }
        : { style })}
    />
  </Close>
));

ModalFooterButton.displayName = "ModalFooterButton";

export default ModalFooterButton;
