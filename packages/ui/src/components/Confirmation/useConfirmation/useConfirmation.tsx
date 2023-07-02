import React from "react";

import Confirmation from "../Confirmation";
import { ConfirmationProps } from "../Confirmation.props";

export const useConfirmation = (
  trigger: ConfirmationProps["trigger"]
): [React.ReactElement, (props: ConfirmationProps) => void, boolean] => {
  const [open, setOpen] = React.useState<boolean>(false);
  const [props, setProps] = React.useState<ConfirmationProps>({
    title: "",
    description: ""
  });

  const element = React.useMemo(
    () => (
      // Hoist open prop to allow slow running tests
      <Confirmation
        open={open}
        {...props}
        onOpenChange={setOpen}
        trigger={trigger}
      />
    ),
    [open, props, trigger]
  );

  const confirm = (props: ConfirmationProps): void => {
    setProps(props);
    setOpen(true);
  };

  return [element, confirm, open];
};
