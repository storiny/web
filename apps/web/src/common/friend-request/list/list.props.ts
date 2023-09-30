import { FriendRequest } from "@storiny/types";
import { VirtuosoProps } from "react-virtuoso";

import { FriendRequestProps } from "../../../../../../packages/ui/src/entities/friend-request";

export interface VirtualizedFriendRequestListProps
  extends VirtuosoProps<FriendRequest, any> {
  /**
   * Props passed down to individual friend request entities.
   */
  friend_request_props?: Partial<FriendRequestProps>;
  /**
   * Array of friend requests to render.
   */
  friend_requests: FriendRequest[];
  /**
   * Flag indicating whether there are more friend requests to render.
   */
  has_more: boolean;
  /**
   * A callback function to fetch more friend requests.
   */
  load_more: () => void;
}
