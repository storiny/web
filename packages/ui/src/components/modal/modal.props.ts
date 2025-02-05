import { Dialog } from "radix-ui";
import React from "react";

import { ModalFooterProps } from "~/components/modal/footer";
import { PolymorphicProps } from "~/types/index";

import { IconButtonProps } from "../icon-button";
import { TabsProps } from "../tabs";
import { ModalHeaderProps } from "./header";
import { ModalSidebarProps } from "./sidebar";

export type ModalMode = "default" | "tabbed";

type ModalPrimitive = Dialog.DialogProps & PolymorphicProps<"div">;

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
  hide_close_button?: boolean;
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
  slot_props?: {
    body?: React.ComponentPropsWithoutRef<"div">;
    close_button?: IconButtonProps;
    container?: Omit<
      React.ComponentPropsWithoutRef<"div">,
      "defaultValue" | "dir"
    > &
      TabsProps;
    content?: Dialog.DialogContentProps;
    footer?: ModalFooterProps;
    header?: ModalHeaderProps;
    main?: React.ComponentPropsWithoutRef<"div">;
    overlay?: Dialog.DialogOverlayProps;
    portal?: Dialog.DialogPortalProps;
    sidebar?: ModalSidebarProps;
    tabs?: TabsProps;
    trigger?: Dialog.DialogTriggerProps;
  };
  /**
   * The trigger component.
   */
  trigger?: React.ReactNode;
}
