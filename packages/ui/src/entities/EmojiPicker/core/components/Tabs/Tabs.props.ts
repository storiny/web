import React from "react";
import { GroupedVirtuosoHandle } from "react-virtuoso";

import { TabsProps } from "~/components/Tabs";

export interface EmojiPickerTabsProps extends TabsProps {
  /**
   * Ref holding the virtualized list
   */
  listRef: React.RefObject<GroupedVirtuosoHandle>;
}
