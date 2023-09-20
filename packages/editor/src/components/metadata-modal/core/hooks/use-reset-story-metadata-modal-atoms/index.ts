import { useResetAtom } from "jotai/utils";
import React from "react";

import { navSegmentAtom, sidebarTabAtom } from "../../atoms";

/**
 * Hook for resetting modal atom values
 */
export const useResetStoryMetadataModalAtoms = (): (() => void) => {
  const resetNavSegment = useResetAtom(navSegmentAtom);
  const resetSidebarTab = useResetAtom(sidebarTabAtom);

  return React.useCallback(() => {
    resetNavSegment();
    resetSidebarTab();
  }, [resetNavSegment, resetSidebarTab]);
};
