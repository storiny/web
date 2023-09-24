import { useResetAtom } from "jotai/utils";
import React from "react";

import {
  navSegmentAtom,
  pendingImageAtom,
  queryAtom,
  selectedAtom,
  sidebarTabAtom,
  uploadingAtom
} from "../../atoms";

/**
 * Hook for resetting gallery atom values
 */
export const useResetGalleryAtoms = (): (() => void) => {
  const resetNavSegment = useResetAtom(navSegmentAtom);
  const resetPendingImage = useResetAtom(pendingImageAtom);
  const resetQuery = useResetAtom(queryAtom);
  const resetSelected = useResetAtom(selectedAtom);
  const resetSidebarTab = useResetAtom(sidebarTabAtom);
  const resetUploading = useResetAtom(uploadingAtom);

  return React.useCallback(() => {
    resetNavSegment();
    resetPendingImage();
    resetQuery();
    resetSelected();
    resetSidebarTab();
    resetUploading();
  }, [
    resetNavSegment,
    resetPendingImage,
    resetQuery,
    resetSelected,
    resetSidebarTab,
    resetUploading
  ]);
};
