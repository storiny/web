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

import XIcon from "~/icons/X";
import { forwardRef } from "~/utils/forwardRef";

import overlayStyles from "../common/Overlay.module.scss";
import IconButton from "../IconButton";
import Tabs from "../Tabs";
import ModalFooter from "./Footer";
import ModalHeader from "./Header";
import styles from "./Modal.module.scss";
import { ModalProps } from "./Modal.props";
import ModalSidebar from "./Sidebar";

export { Description } from "@radix-ui/react-dialog";

const Modal = forwardRef<ModalProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    fullscreen,
    mode = "default",
    sidebar,
    footer,
    trigger,
    slotProps,
    hideCloseButton,
    className,
    children,
    ...rest
  } = props;
  const isTabbedMode = mode === "tabbed" && sidebar;
  const Container = isTabbedMode ? Tabs : "div";

  return (
    <Root {...rest}>
      <Trigger asChild {...slotProps?.trigger}>
        {trigger}
      </Trigger>
      <Portal {...slotProps?.portal}>
        <Overlay
          {...slotProps?.overlay}
          className={clsx(
            overlayStyles.overlay,
            fullscreen && overlayStyles.fullscreen,
            slotProps?.overlay
          )}
        />
        <Content
          {...slotProps?.content}
          asChild
          className={clsx(
            "flex-center",
            styles.content,
            fullscreen && styles.fullscreen,
            className,
            slotProps?.content?.className
          )}
          ref={ref}
        >
          <Component>
            <Container
              {...slotProps?.container}
              className={clsx(
                "flex-center",
                styles.container,
                slotProps?.container?.className
              )}
              // Props passed to the Tabs component
              {...(isTabbedMode && {
                ...slotProps?.tabs,
                orientation: "vertical",
                activationMode: "manual"
              })}
            >
              {sidebar && (
                <ModalSidebar {...slotProps?.sidebar}>{sidebar}</ModalSidebar>
              )}
              <div
                {...slotProps?.main}
                className={clsx(
                  "flex-center",
                  styles.main,
                  slotProps?.main?.className
                )}
              >
                <ModalHeader {...slotProps?.header} />
                <div
                  {...slotProps?.body}
                  className={clsx(styles.body, slotProps?.body?.className)}
                >
                  {children}
                </div>
                {footer && (
                  <ModalFooter {...slotProps?.footer}>{footer}</ModalFooter>
                )}
                {/*
                  Close button is positioned with absolute position so that it's the
                  last element to get focused in the focus trap cycle
                 */}
                {!hideCloseButton && (
                  <Close asChild>
                    <IconButton
                      aria-label={"Close"}
                      title={"Close"}
                      {...slotProps?.closeButton}
                      className={clsx(
                        styles.close,
                        slotProps?.closeButton?.className
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
