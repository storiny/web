import { atom } from "jotai";

import { GallerySidebarTabsValue } from "../sidebarTab";

export type NavSegmentValue =
  | Exclude<GallerySidebarTabsValue, "whiteboard">
  | "home";

export const navSegmentAtom = atom<NavSegmentValue>("home");
