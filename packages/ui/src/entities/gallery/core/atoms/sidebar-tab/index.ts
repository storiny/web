import { atomWithReset } from "jotai/utils";

export type GallerySidebarTabsValue =
  | "pexels"
  | "whiteboard"
  | "library"
  | "upload";

export const sidebarTabAtom = atomWithReset<GallerySidebarTabsValue>("pexels");
