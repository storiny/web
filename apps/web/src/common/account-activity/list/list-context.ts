"use client";

import React from "react";

import { AccountActivityProps } from "../../../../../../packages/ui/src/entities/account-activity";

// Context for individual account activity entities.
export const VirtualizedAccountActivityListContext = React.createContext<{
  accountActivityProps: Partial<AccountActivityProps>;
  itemCount: number;
}>({ itemCount: 0, accountActivityProps: {} });
