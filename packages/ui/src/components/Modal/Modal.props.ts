import {
  DialogContentProps,
  DialogOverlayProps,
  DialogPortalProps,
  DialogProps,
  DialogTriggerProps
} from "@radix-ui/react-dialog";
import React from "react";

import { PolymorphicProps } from "~/types/index";

import { IconButtonProps } from "../IconButton";
import { TabsProps } from "../Tabs";
import { ModalHeaderProps } from "./Header";
import { ModalSidebarProps } from "./Sidebar";

export type ModalMode = "default" | "tabbed";

type ModalPrimitive = DialogProps & PolymorphicProps<"div">;

export interface ModalProps extends ModalPrimitive {
  /**
   * Whether to render a footer.
   */
  footer?: React.ReactNode;
  /**
   * Whether to render the modal in fullscreen mode.
   * @default false
   */
  fullscreen?: boolean;
  /**
   * Whether to hide the close button.
   * @default false
   */
  hideCloseButton?: boolean;
  /**
   * The content display mode of the component. Requires SidebarList and
   * SidebarItem components to be passed through the `sidebar` prop when
   * set to `tabbed` mode.
   *
   * @default 'default'
   */
  mode?: ModalMode;
  /**
   * Whether to render a sidebar.
   */
  sidebar?: React.ReactNode;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    body?: React.ComponentPropsWithoutRef<"div">;
    closeButton?: IconButtonProps;
    container?: Omit<
      React.ComponentPropsWithoutRef<"div">,
      "defaultValue" | "dir"
    > &
      TabsProps;
    content?: DialogContentProps;
    footer?: React.ComponentPropsWithoutRef<"div">;
    header?: ModalHeaderProps;
    main?: React.ComponentPropsWithoutRef<"div">;
    overlay?: DialogOverlayProps;
    portal?: DialogPortalProps;
    sidebar?: ModalSidebarProps;
    tabs?: TabsProps;
    trigger?: DialogTriggerProps;
  };
  /**
   * The trigger component.
   */
  trigger?: React.ReactNode;
}
