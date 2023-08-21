import { FriendRequest } from "@storiny/types";
import { VirtuosoProps } from "react-virtuoso";

import { FriendRequestProps } from "~/entities/FriendRequest";

export interface VirtualizedFriendRequestListProps
  extends VirtuosoProps<FriendRequest, any> {
  /**
   * Props passed down to individual friend request entities.
   */
  friendRequestProps?: Partial<FriendRequestProps>;
  /**
   * Array of friend requests to render.
   */
  friendRequests: FriendRequest[];
  /**
   * Flag indicating whether there are more friend requests to render.
   */
  hasMore: boolean;
  /**
   * A callback function to fetch more friend requests.
   */
  loadMore: () => void;
}
