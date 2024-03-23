import { RightSidebarProps } from "~/layout/right-sidebar";

export type BlogRightSidebarProps = RightSidebarProps & {
  /**
   * Whether to hide the editors.
   * @default false
   */
  hide_editors?: boolean;
  /**
   * Whether the sidebar is mounted on the homepage.
   * @default false
   */
  is_homepage?: boolean;
};
