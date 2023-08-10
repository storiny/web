"use client";

import React from "react";

import Modal from "../Modal";
import { ModalProps } from "../Modal.props";

/**
 * Hook for rendering modals
 * @param trigger Modal trigger component
 * @param children Modal children
 * @param props Modal props
 */
export const useModal = (
  trigger: ({
    openModal,
    closeModal
  }: {
    closeModal: () => void;
    openModal: () => void;
  }) => ModalProps["trigger"],
  children: React.ReactNode,
  props?: Omit<ModalProps, "trigger" | "children">
): [React.ReactElement, () => void, () => void, boolean] => {
  const [open, setOpen] = React.useState<boolean>(false);
  const openModal = React.useCallback(() => setOpen(true), []);
  const closeModal = React.useCallback(() => setOpen(false), []);
  const element = React.useMemo(
    () => (
      // Hoist open prop to allow slow running tests
      <Modal
        open={open}
        {...props}
        onOpenChange={props?.onOpenChange || setOpen}
        trigger={trigger({ closeModal, openModal })}
      >
        {children}
      </Modal>
    ),
    [children, closeModal, open, openModal, props, trigger]
  );

  return [element, openModal, closeModal, open];
};
