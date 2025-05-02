import React from "react";
import { GroupedVirtuosoHandle } from "react-virtuoso";

import { TabsProps } from "~/components/tabs";

export interface EmojiPickerTabsProps extends TabsProps {
  /**
   * Ref holding the virtualized list
   */
  list_ref: React.RefObject<GroupedVirtuosoHandle | null>;
}
