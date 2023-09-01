import { atom } from "jotai";

export type GallerySidebarTabsValue =
  | "pexels"
  | "whiteboard"
  | "library"
  | "upload";

export const sidebarTabAtom = atom<GallerySidebarTabsValue>("pexels");
