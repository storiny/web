"use client";

import React from "react";

import { FriendRequestProps } from "~/entities/FriendRequest";

// Context for individual friend request entities.
export const VirtualizedFriendRequestListContext = React.createContext<
  Partial<FriendRequestProps>
>({});
