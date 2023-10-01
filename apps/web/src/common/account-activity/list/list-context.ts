"use client";

import React from "react";

import { AccountActivityProps } from "~/entities/account-activity";

// Context for individual account activity entities.
export const VirtualizedAccountActivityListContext = React.createContext<{
  account_activity_props: Partial<AccountActivityProps>;
  item_count: number;
}>({ item_count: 0, account_activity_props: {} });
