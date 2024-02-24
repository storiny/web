import { RelationsTabValue } from "../client";
import { RelationsProps } from "../relations.props";

export type RelationsRightSidebarProps = {
  tab: RelationsTabValue;
} & Pick<RelationsProps, "pending_friend_request_count">;
