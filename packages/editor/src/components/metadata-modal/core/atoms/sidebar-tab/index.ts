import { atomWithReset } from "jotai/utils";

export type StoryMetadataModalSidebarTabsValue =
  | "general"
  | "seo"
  | "license"
  | "settings";

export const sidebarTabAtom =
  atomWithReset<StoryMetadataModalSidebarTabsValue>("general");
