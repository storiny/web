import React from "react";

import Confirmation from "../Confirmation";
import { ConfirmationProps } from "../Confirmation.props";

/**
 * Hook for rendering confirmation modals
 * @param trigger Confirmation trigger props
 * @param props Confirmation props
 */
export const useConfirmation = (
  trigger: ({
    openConfirmation,
    closeConfirmation
  }: {
    closeConfirmation: () => void;
    openConfirmation: () => void;
  }) => ConfirmationProps["trigger"],
  props: Pick<ConfirmationProps, "title" | "description"> &
    Partial<Omit<ConfirmationProps, "trigger" | "children">>
): [React.ReactElement, () => void, () => void, boolean] => {
  const [open, setOpen] = React.useState<boolean>(false);
  const openConfirmation = React.useCallback(() => setOpen(true), []);
  const closeConfirmation = React.useCallback(() => setOpen(false), []);
  const element = React.useMemo(
    () => (
      // Hoist open prop to allow slow running tests
      <Confirmation
        open={open}
        {...props}
        onOpenChange={setOpen}
        trigger={trigger({ closeConfirmation, openConfirmation })}
      />
    ),
    [closeConfirmation, open, openConfirmation, props, trigger]
  );

  return [element, openConfirmation, closeConfirmation, open];
};
