"use client";

import React from "react";

import Modal from "../Modal";
import { ModalProps } from "../Modal.props";

export const useModal = (
  trigger: ModalProps["trigger"]
): [
  React.ReactElement,
  (children: React.ReactNode, props?: ModalProps) => void,
  boolean
] => {
  const [open, setOpen] = React.useState<boolean>(false);
  const [props, setProps] = React.useState<ModalProps>({});
  const [children, setChildren] = React.useState<React.ReactNode>(null);

  const element = React.useMemo(
    () => (
      // Hoist open prop to allow slow running tests
      <Modal open={open} {...props} onOpenChange={setOpen} trigger={trigger}>
        {children}
      </Modal>
    ),
    [children, open, props, trigger]
  );

  const modal = (newChildren: React.ReactNode, props?: ModalProps) => {
    setChildren(newChildren);
    setProps(props || {});
    setOpen(true);
  };

  return [element, modal, open];
};
