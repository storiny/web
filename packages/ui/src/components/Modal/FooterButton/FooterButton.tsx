"use client";

import { Close } from "@radix-ui/react-dialog";
import React from "react";

import { ModalFooterButtonProps } from "~/components/Modal";

import Button from "../../Button";

const ModalFooterButton = React.forwardRef<
  HTMLButtonElement,
  ModalFooterButtonProps
>((props, ref) => (
  <Close asChild>
    <Button {...props} ref={ref} />
  </Close>
));

ModalFooterButton.displayName = "ModalFooterButton";

export default ModalFooterButton;
