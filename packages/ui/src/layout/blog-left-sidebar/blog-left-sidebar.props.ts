import { LeftSidebarProps } from "~/layout/left-sidebar";

export type BlogLeftSidebarProps = LeftSidebarProps & {
  /**
   * Whether the sidebar is mounted on the homepage.
   * @default false
   */
  is_homepage?: boolean;
};
