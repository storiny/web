import { DraftsTabValue } from "../client";
import { DraftsProps } from "../drafts.props";

export type DraftsRightSidebarProps = {
  tab: DraftsTabValue;
} & Pick<DraftsProps, "latest_draft">;
