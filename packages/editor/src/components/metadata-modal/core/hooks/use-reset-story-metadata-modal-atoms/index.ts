import { useResetAtom as use_reset_atom } from "jotai/utils";
import React from "react";

import { nav_segment_atom, sidebar_tab_atom } from "../../atoms";

/**
 * Hook for resetting modal atom values
 */
export const use_reset_story_metadata_modal_atoms = (): (() => void) => {
  const reset_nav_segment = use_reset_atom(nav_segment_atom);
  const reset_sidebar_tab = use_reset_atom(sidebar_tab_atom);

  return React.useCallback(() => {
    reset_nav_segment();
    reset_sidebar_tab();
  }, [reset_nav_segment, reset_sidebar_tab]);
};
