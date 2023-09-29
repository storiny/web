import React from "react";

import Confirmation from "../confirmation";
import { ConfirmationProps } from "../confirmation.props";

/**
 * Hook for rendering confirmation dialogs
 * @param trigger Confirmation trigger props
 * @param props Confirmation props
 */
export const use_confirmation = (
  trigger: ({
    open_confirmation,
    close_confirmation
  }: {
    close_confirmation: () => void;
    open_confirmation: () => void;
  }) => ConfirmationProps["trigger"],
  props: Pick<ConfirmationProps, "title" | "description"> &
    Partial<Omit<ConfirmationProps, "trigger" | "children">>
): [React.ReactElement, () => void, () => void, boolean] => {
  const [open, set_open] = React.useState<boolean>(false);
  const open_confirmation = React.useCallback(() => set_open(true), []);
  const close_confirmation = React.useCallback(() => set_open(false), []);
  const element = React.useMemo(
    () => (
      // Hoist open prop to allow slow running tests
      <Confirmation
        open={open}
        {...props}
        onOpenChange={set_open}
        trigger={trigger({ close_confirmation, open_confirmation })}
      />
    ),
    [close_confirmation, open, open_confirmation, props, trigger]
  );

  return [element, open_confirmation, close_confirmation, open];
};
