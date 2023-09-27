"use client";

import {
  Action,
  Cancel,
  Content,
  Description,
  Overlay,
  Portal,
  Root,
  Title,
  Trigger
} from "@radix-ui/react-alert-dialog";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import Button from "../Button";
import overlayStyles from "../common/Overlay.module.scss";
import Divider from "../Divider";
import styles from "./Confirmation.module.scss";
import { ConfirmationProps } from "./Confirmation.props";

const Confirmation = forwardRef<ConfirmationProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    title,
    description,
    decorator,
    trigger,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    color = "inverted",
    slot_props,
    onConfirm,
    onCancel,
    className,
    ...rest
  } = props;

  return (
    <Root {...rest}>
      <Trigger asChild {...slot_props?.trigger}>
        {trigger}
      </Trigger>
      <Portal {...slot_props?.portal}>
        <Overlay
          {...slot_props?.overlay}
          className={clsx(overlayStyles.overlay, slot_props?.overlay)}
        />
        <Content
          {...slot_props?.content}
          asChild
          className={clsx("flex-center", styles.content, className)}
          ref={ref}
        >
          <Component>
            <div
              {...slot_props?.container}
              className={clsx(
                "flex-center",
                styles.container,
                slot_props?.container?.className
              )}
            >
              {decorator && (
                <span
                  {...slot_props?.decorator}
                  className={clsx(
                    "flex-center",
                    styles.decorator,
                    slot_props?.decorator?.className
                  )}
                >
                  {decorator}
                </span>
              )}
              <Title
                {...slot_props?.title}
                className={clsx(
                  "t-body-1",
                  "t-major",
                  "t-center",
                  styles.title,
                  slot_props?.title?.className
                )}
              >
                {title}
              </Title>
              <Description
                {...slot_props?.description}
                className={clsx(
                  "t-body-2",
                  "t-minor",
                  "t-center",
                  slot_props?.description?.className
                )}
              >
                {description}
              </Description>
            </div>
            <Divider
              {...slot_props?.divider}
              className={clsx("only-mobile", slot_props?.divider?.className)}
            />
            <div
              {...slot_props?.footer}
              className={clsx(
                "flex-center",
                styles.footer,
                slot_props?.footer?.className
              )}
            >
              <Cancel asChild>
                <Button
                  variant={"ghost"}
                  {...slot_props?.cancelButton}
                  className={clsx(
                    styles.action,
                    slot_props?.cancelButton?.className
                  )}
                  onClick={(event): void => {
                    onCancel?.(event);
                    slot_props?.cancelButton?.onClick?.(event);
                  }}
                >
                  {cancelLabel}
                </Button>
              </Cancel>
              <Action asChild>
                <Button
                  color={color}
                  {...slot_props?.confirmButton}
                  className={clsx(
                    styles.action,
                    slot_props?.confirmButton?.className
                  )}
                  onClick={(event): void => {
                    onConfirm?.(event);
                    slot_props?.confirmButton?.onClick?.(event);
                  }}
                >
                  {confirmLabel}
                </Button>
              </Action>
            </div>
          </Component>
        </Content>
      </Portal>
    </Root>
  );
});

Confirmation.displayName = "Confirmation";

export default Confirmation;
