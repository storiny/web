"use client";

import { Portal, Sub, SubContent, SubTrigger } from "@radix-ui/react-menubar";
import clsx from "clsx";
import React from "react";

import ChevronIcon from "~/icons/chevron";
import { forward_ref } from "~/utils/forward-ref";

import menu_styles from "../common/menu.module.scss";
import menu_item_styles from "../common/menu-item.module.scss";
import right_slot_styles from "../common/right-slot.module.scss";
import styles from "./menubar-sub.module.scss";
import { MenubarSubProps } from "./menubar-sub.props";

const MenubarSub = forward_ref<MenubarSubProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    className,
    children,
    trigger,
    slot_props,
    ...rest
  } = props;
  return (
    <Sub {...rest}>
      <SubTrigger
        {...slot_props?.trigger}
        className={clsx(menu_item_styles.item, slot_props?.trigger?.className)}
      >
        {trigger}
        <span
          className={clsx(
            right_slot_styles["right-slot"],
            styles["right-slot"]
          )}
        >
          <ChevronIcon rotation={90} />
        </span>
      </SubTrigger>
      <Portal {...slot_props?.portal}>
        <SubContent
          alignOffset={-5}
          collisionPadding={8}
          sideOffset={5}
          {...slot_props?.content}
          asChild
          className={clsx(
            menu_styles.content,
            menu_styles["sub-content"],
            menu_styles.md,
            className
          )}
          ref={ref}
        >
          <Component>{children}</Component>
        </SubContent>
      </Portal>
    </Sub>
  );
});

MenubarSub.displayName = "MenubarSub";

export default MenubarSub;
