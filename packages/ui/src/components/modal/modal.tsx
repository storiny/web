"use client";

import {
  Close,
  Content,
  Overlay,
  Portal,
  Root,
  Trigger
} from "@radix-ui/react-dialog";
import clsx from "clsx";
import React from "react";

import XIcon from "~/icons/x";
import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

import overlay_styles from "../common/overlay.module.scss";
import IconButton from "../icon-button";
import Tabs from "../tabs";
import ModalFooter from "./footer";
import ModalHeader from "./header";
import styles from "./modal.module.scss";
import { ModalProps } from "./modal.props";
import ModalSidebar from "./sidebar";

export { Description } from "@radix-ui/react-dialog";

const Modal = forward_ref<ModalProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    fullscreen,
    mode = "default",
    sidebar,
    footer,
    trigger,
    slot_props,
    hide_close_button,
    className,
    children,
    ...rest
  } = props;
  const is_tabbed_mode = mode === "tabbed" && sidebar;
  const Container = is_tabbed_mode ? Tabs : "div";

  return (
    <Root {...rest}>
      <Trigger asChild {...slot_props?.trigger}>
        {trigger}
      </Trigger>
      <Portal {...slot_props?.portal}>
        <Overlay
          {...slot_props?.overlay}
          className={clsx(
            overlay_styles.overlay,
            fullscreen && overlay_styles.fullscreen,
            slot_props?.overlay
          )}
        />
        <Content
          {...slot_props?.content}
          asChild
          className={clsx(
            css["flex-center"],
            styles.content,
            fullscreen && styles.fullscreen,
            className,
            slot_props?.content?.className
          )}
          ref={ref}
        >
          <Component>
            <Container
              {...slot_props?.container}
              className={clsx(
                css["flex-center"],
                styles.container,
                slot_props?.container?.className
              )}
              // Props passed to the Tabs component
              {...(is_tabbed_mode && {
                ...slot_props?.tabs,
                orientation: "vertical",
                // eslint-disable-next-line prefer-snakecase/prefer-snakecase
                activationMode: "manual"
              })}
            >
              {sidebar && (
                <ModalSidebar {...slot_props?.sidebar}>{sidebar}</ModalSidebar>
              )}
              <div
                {...slot_props?.main}
                className={clsx(
                  css["flex-center"],
                  styles.main,
                  slot_props?.main?.className
                )}
              >
                <ModalHeader {...slot_props?.header} />
                <div
                  {...slot_props?.body}
                  className={clsx(styles.body, slot_props?.body?.className)}
                >
                  {children}
                </div>
                {footer && (
                  <ModalFooter {...slot_props?.footer}>{footer}</ModalFooter>
                )}
                {/*
                  Close button is positioned with absolute position so that it's the
                  last element to get focused in the focus trap cycle
                 */}
                {!hide_close_button && (
                  <Close asChild>
                    <IconButton
                      aria-label={"Close"}
                      title={"Close"}
                      {...slot_props?.close_button}
                      className={clsx(
                        styles.close,
                        slot_props?.close_button?.className
                      )}
                      variant={"ghost"}
                    >
                      <XIcon />
                    </IconButton>
                  </Close>
                )}
              </div>
            </Container>
          </Component>
        </Content>
      </Portal>
    </Root>
  );
});

Modal.displayName = "Modal";

export default Modal;
