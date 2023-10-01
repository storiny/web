"use client";

import React from "react";

import { NotificationProps } from "~/entities/notification";

// Context for individual notification entities.
export const VirtualizedNotificationListContext = React.createContext<
  Partial<NotificationProps>
>({});
