import { useResetAtom } from "jotai/utils";
import React from "react";

import { nav_segment_atom, sidebar_tab_atom } from "../../atoms";

/**
 * Hook for resetting modal atom values
 */
export const useResetStoryMetadataModalAtoms = (): (() => void) => {
  const resetNavSegment = useResetAtom(nav_segment_atom);
  const resetSidebarTab = useResetAtom(sidebar_tab_atom);

  return React.useCallback(() => {
    resetNavSegment();
    resetSidebarTab();
  }, [resetNavSegment, resetSidebarTab]);
};
