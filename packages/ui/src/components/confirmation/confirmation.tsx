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

import { forward_ref } from "src/utils/forward-ref";

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
    <Root {...rest}>
      <Trigger asChild {...slot_props?.trigger}>
        {trigger}
      </Trigger>
      <Portal {...slot_props?.portal}>
        <Overlay
          {...slot_props?.overlay}
          className={clsx(overlay_styles.overlay, slot_props?.overlay)}
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
              </Cancel>
              <Action asChild>
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
