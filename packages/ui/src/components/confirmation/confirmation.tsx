"use client";

import clsx from "clsx";
import { AlertDialog } from "radix-ui";
import React from "react";

import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

import Button from "../button";
import overlay_styles from "../common/overlay.module.scss";
import Divider from "../divider";
import styles from "./confirmation.module.scss";
import { ConfirmationProps } from "./confirmation.props";

const Confirmation = forward_ref<ConfirmationProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    title,
    description,
    decorator,
    trigger,
    confirm_label = "Confirm",
    cancel_label = "Cancel",
    color = "inverted",
    slot_props,
    on_confirm,
    on_cancel,
    className,
    ...rest
  } = props;
  return (
    <AlertDialog.Root {...rest}>
      <AlertDialog.Trigger asChild {...slot_props?.trigger}>
        {trigger}
      </AlertDialog.Trigger>
      <AlertDialog.Portal {...slot_props?.portal}>
        <AlertDialog.Overlay
          {...slot_props?.overlay}
          className={clsx(overlay_styles.overlay, slot_props?.overlay)}
        />
        <AlertDialog.Content
          {...slot_props?.content}
          asChild
          className={clsx(css["flex-center"], styles.content, className)}
          ref={ref}
        >
          <Component>
            <div
              {...slot_props?.container}
              className={clsx(
                css["flex-center"],
                styles.container,
                slot_props?.container?.className
              )}
            >
              {decorator && (
                <span
                  {...slot_props?.decorator}
                  className={clsx(
                    css["flex-center"],
                    styles.decorator,
                    slot_props?.decorator?.className
                  )}
                >
                  {decorator}
                </span>
              )}
              <AlertDialog.Title
                {...slot_props?.title}
                className={clsx(
                  css["t-body-1"],
                  css["t-major"],
                  css["t-center"],
                  styles.title,
                  slot_props?.title?.className
                )}
              >
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description
                {...slot_props?.description}
                className={clsx(
                  css["t-body-2"],
                  css["t-minor"],
                  css["t-center"],
                  slot_props?.description?.className
                )}
              >
                {description}
              </AlertDialog.Description>
            </div>
            <Divider
              {...slot_props?.divider}
              className={clsx(
                css["only-mobile"],
                slot_props?.divider?.className
              )}
            />
            <div
              {...slot_props?.footer}
              className={clsx(
                css["flex-center"],
                styles.footer,
                slot_props?.footer?.className
              )}
            >
              <AlertDialog.Cancel asChild>
                <Button
                  variant={"ghost"}
                  {...slot_props?.cancel_button}
                  className={clsx(
                    styles.action,
                    slot_props?.cancel_button?.className
                  )}
                  onClick={(event): void => {
                    on_cancel?.(event);
                    slot_props?.cancel_button?.onClick?.(event);
                  }}
                >
                  {cancel_label}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  color={color}
                  {...slot_props?.confirm_button}
                  className={clsx(
                    styles.action,
                    slot_props?.confirm_button?.className
                  )}
                  onClick={(event): void => {
                    on_confirm?.(event);
                    slot_props?.confirm_button?.onClick?.(event);
                  }}
                >
                  {confirm_label}
                </Button>
              </AlertDialog.Action>
            </div>
          </Component>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
});

Confirmation.displayName = "Confirmation";

export default Confirmation;
