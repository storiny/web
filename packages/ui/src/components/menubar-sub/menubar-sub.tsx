"use client";

import clsx from "clsx";
import { Menubar } from "radix-ui";
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
    <Menubar.Sub {...rest}>
      <Menubar.SubTrigger
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
      </Menubar.SubTrigger>
      <Menubar.Portal {...slot_props?.portal}>
        <Menubar.SubContent
          alignOffset={-5}
          collisionPadding={12}
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
        </Menubar.SubContent>
      </Menubar.Portal>
    </Menubar.Sub>
  );
});

MenubarSub.displayName = "MenubarSub";

export default MenubarSub;
