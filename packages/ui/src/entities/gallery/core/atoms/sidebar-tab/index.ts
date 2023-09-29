import { atomWithReset as atom_with_reset } from "jotai/utils";

export type GallerySidebarTabsValue =
  | "pexels"
  | "whiteboard"
  | "library"
  | "upload";

export const sidebar_tab_atom =
  atom_with_reset<GallerySidebarTabsValue>("pexels");
