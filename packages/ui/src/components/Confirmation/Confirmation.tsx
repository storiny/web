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
    slotProps,
    onConfirm,
    onCancel,
    className,
    ...rest
  } = props;

  return (
    <Root {...rest}>
      <Trigger asChild {...slotProps?.trigger}>
        {trigger}
      </Trigger>
      <Portal {...slotProps?.portal}>
        <Overlay
          {...slotProps?.overlay}
          className={clsx(overlayStyles.overlay, slotProps?.overlay)}
        />
        <Content
          {...slotProps?.content}
          asChild
          className={clsx("flex-center", styles.content, className)}
          ref={ref}
        >
          <Component>
            <div
              {...slotProps?.container}
              className={clsx(
                "flex-center",
                styles.container,
                slotProps?.container?.className
              )}
            >
              {decorator && (
                <span
                  {...slotProps?.decorator}
                  className={clsx(
                    "flex-center",
                    styles.decorator,
                    slotProps?.decorator?.className
                  )}
                >
                  {decorator}
                </span>
              )}
              <Title
                {...slotProps?.title}
                className={clsx(
                  "t-body-1",
                  "t-major",
                  "t-center",
                  styles.title,
                  slotProps?.title?.className
                )}
              >
                {title}
              </Title>
              <Description
                {...slotProps?.description}
                className={clsx(
                  "t-body-2",
                  "t-minor",
                  "t-center",
                  slotProps?.description?.className
                )}
              >
                {description}
              </Description>
            </div>
            <Divider
              {...slotProps?.divider}
              className={clsx("only-mobile", slotProps?.divider?.className)}
            />
            <div
              {...slotProps?.footer}
              className={clsx(
                "flex-center",
                styles.footer,
                slotProps?.footer?.className
              )}
            >
              <Cancel asChild>
                <Button
                  variant={"ghost"}
                  {...slotProps?.cancelButton}
                  className={clsx(
                    styles.action,
                    slotProps?.cancelButton?.className
                  )}
                  onClick={(event): void => {
                    onCancel?.(event);
                    slotProps?.cancelButton?.onClick?.(event);
                  }}
                >
                  {cancelLabel}
                </Button>
              </Cancel>
              <Action asChild>
                <Button
                  color={color}
                  {...slotProps?.confirmButton}
                  className={clsx(
                    styles.action,
                    slotProps?.confirmButton?.className
                  )}
                  onClick={(event): void => {
                    onConfirm?.(event);
                    slotProps?.confirmButton?.onClick?.(event);
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
