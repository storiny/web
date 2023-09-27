import { AccountActivity } from "@storiny/types";
import { VirtuosoProps } from "react-virtuoso";

import { AccountActivityProps } from "../../../../../../packages/ui/src/entities/account-activity";

export interface VirtualizedAccountActivityListProps
  extends VirtuosoProps<AccountActivity, any> {
  /**
   * Array of account activities requests to render.
   */
  accountActivities: AccountActivity[];
  /**
   * Props passed down to individual account activities entities.
   */
  accountActivityProps?: Partial<AccountActivityProps>;
  /**
   * Flag indicating whether there are more account activities to render.
   */
  has_more: boolean;
  /**
   * A callback function to fetch more account activities.
   */
  loadMore: () => void;
}
