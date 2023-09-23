"use client";

import React from "react";

import { FriendRequestProps } from "~/entities/friend-request";

// Context for individual friend request entities.
export const VirtualizedFriendRequestListContext = React.createContext<
  Partial<FriendRequestProps>
>({});
