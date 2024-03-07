import { RelationsTabValue } from "../client";
import { EditorsProps } from "../editors.props";

export type RelationsRightSidebarProps = {
  tab: RelationsTabValue;
} & Pick<EditorsProps, "pending_friend_request_count">;
