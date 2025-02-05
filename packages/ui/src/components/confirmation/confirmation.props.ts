import { AlertDialog } from "radix-ui";
import React from "react";

import { PolymorphicProps } from "~/types/index";

import { ButtonProps } from "../button";
import { DividerProps } from "../divider";

export type ConfirmationColor = "inverted" | "ruby";

type ConfirmationPrimitive = AlertDialog.AlertDialogProps &
  Omit<PolymorphicProps<"div">, "title">;

export interface ConfirmationProps extends ConfirmationPrimitive {
  /**
   * The label for cancellation button.
   * @default 'Cancel'
   */
  cancel_label?: string;
  /**
   * The color of the component.
   * @default 'inverted'
   */
  color?: ConfirmationColor;
  /**
   * The label for confirmation button.
   * @default 'Confirm'
   */
  confirm_label?: string;
  /**
   * The element placed above the children.
   */
  decorator?: React.ReactNode;
  /**
   * The confirmation description.
   */
  description: React.ReactNode;
  /**
   * The cancellation callback.
   */
  on_cancel?: React.MouseEventHandler<HTMLButtonElement>;
  /**
   * The confirmation callback.
   */
  on_confirm?: React.MouseEventHandler<HTMLButtonElement>;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    cancel_button?: ButtonProps;
    confirm_button?: ButtonProps;
    container?: React.ComponentPropsWithoutRef<"div">;
    content?: AlertDialog.AlertDialogContentProps;
    decorator?: React.ComponentPropsWithoutRef<"span">;
    description?: AlertDialog.AlertDialogDescriptionProps;
    divider?: DividerProps;
    footer?: React.ComponentPropsWithoutRef<"div">;
    overlay?: AlertDialog.AlertDialogOverlayProps;
    portal?: AlertDialog.AlertDialogPortalProps;
    title?: AlertDialog.AlertDialogTitleProps;
    trigger?: AlertDialog.AlertDialogTriggerProps;
  };
  /**
   * The confirmation title.
   */
  title: React.ReactNode;
  /**
   * The trigger component.
   */
  trigger?: React.ReactNode;
}
