import {
  AlertDialogContentProps,
  AlertDialogDescriptionProps,
  AlertDialogOverlayProps,
  AlertDialogPortalProps,
  AlertDialogProps,
  AlertDialogTitleProps,
  AlertDialogTriggerProps
} from "@radix-ui/react-alert-dialog";
import React from "react";

import { PolymorphicProps } from "~/types/index";

import { ButtonProps } from "../Button";
import { DividerProps } from "../Divider";

export type ConfirmationColor = "inverted" | "ruby";

type ConfirmationPrimitive = AlertDialogProps &
  Omit<PolymorphicProps<"div">, "title">;

export interface ConfirmationProps extends ConfirmationPrimitive {
  /**
   * The label for cancellation button.
   * @default 'Cancel'
   */
  cancelLabel?: string;
  /**
   * The color of the component.
   * @default 'inverted'
   */
  color?: ConfirmationColor;
  /**
   * The label for confirmation button.
   * @default 'Confirm'
   */
  confirmLabel?: string;
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
  onCancel?: React.MouseEventHandler<HTMLButtonElement>;
  /**
   * The confirmation callback.
   */
  onConfirm?: React.MouseEventHandler<HTMLButtonElement>;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    cancelButton?: ButtonProps;
    confirmButton?: ButtonProps;
    container?: React.ComponentPropsWithoutRef<"div">;
    content?: AlertDialogContentProps;
    decorator?: React.ComponentPropsWithoutRef<"span">;
    description?: AlertDialogDescriptionProps;
    divider?: DividerProps;
    footer?: React.ComponentPropsWithoutRef<"div">;
    overlay?: AlertDialogOverlayProps;
    portal?: AlertDialogPortalProps;
    title?: AlertDialogTitleProps;
    trigger?: AlertDialogTriggerProps;
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
