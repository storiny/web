import { BlogEditorsProps } from "../editors.props";

export type EditorsRightSidebarProps = Pick<
  BlogEditorsProps,
  "pending_editor_request_count"
>;
