import { BlogWritersProps } from "../writers.props";

export type WritersRightSidebarProps = Pick<
  BlogWritersProps,
  "pending_writer_request_count"
>;
