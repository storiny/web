import { ContributionsProps } from "../contributions.props";

export type ContributionsRightSidebarProps = Pick<
  ContributionsProps,
  "pending_collaboration_request_count"
>;
