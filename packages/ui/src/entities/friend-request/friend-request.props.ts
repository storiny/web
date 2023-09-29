import { FriendRequest } from "@storiny/types";
import React from "react";

export interface FriendRequestProps
  extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * The friend request object
   */
  friend_request: FriendRequest;
}
