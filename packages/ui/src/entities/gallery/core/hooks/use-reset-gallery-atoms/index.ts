import { useResetAtom as use_reset_atom } from "jotai/utils";
import React from "react";

import {
  nav_segment_atom,
  pending_image_atom,
  query_atom,
  selected_atom,
  sidebar_tab_atom,
  uploading_atom
} from "../../atoms";

/**
 * Hook for resetting gallery atom values
 */
export const use_reset_gallery_atoms = (): (() => void) => {
  const reset_nav_segment = use_reset_atom(nav_segment_atom);
  const reset_pending_image = use_reset_atom(pending_image_atom);
  const reset_query = use_reset_atom(query_atom);
  const reset_selected = use_reset_atom(selected_atom);
  const reset_sidebar_tab = use_reset_atom(sidebar_tab_atom);
  const reset_uploading = use_reset_atom(uploading_atom);

  return React.useCallback(() => {
    reset_nav_segment();
    reset_pending_image();
    reset_query();
    reset_selected();
    reset_sidebar_tab();
    reset_uploading();
  }, [
    reset_nav_segment,
    reset_pending_image,
    reset_query,
    reset_selected,
    reset_sidebar_tab,
    reset_uploading
  ]);
};
