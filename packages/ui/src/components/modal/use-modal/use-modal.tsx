"use client";

import React from "react";

import Modal from "../modal";
import { ModalProps } from "../modal.props";

/**
 * Hook for rendering modals
 * @param trigger Modal trigger component
 * @param children Modal children
 * @param props Modal props
 */
export const use_modal = (
  trigger: ({
    open_modal,
    close_modal
  }: {
    close_modal: () => void;
    open_modal: () => void;
  }) => ModalProps["trigger"],
  children: React.ReactNode,
  props?: Omit<ModalProps, "trigger" | "children">
): [React.ReactElement, () => void, () => void, boolean] => {
  const [open, set_open] = React.useState<boolean>(false);
  const open_modal = React.useCallback(() => set_open(true), []);
  const close_modal = React.useCallback(() => set_open(false), []);
  const element = React.useMemo(
    () => (
      // Hoist open prop to allow slow running tests
      <Modal
        open={open}
        {...props}
        onOpenChange={props?.onOpenChange || set_open}
        trigger={trigger({ close_modal, open_modal })}
      >
        {children}
      </Modal>
    ),
    [children, close_modal, open, open_modal, props, trigger]
  );

  return [element, open_modal, close_modal, open];
};
