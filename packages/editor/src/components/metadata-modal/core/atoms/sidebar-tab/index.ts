import { atomWithReset } from "jotai/utils";

export type StoryMetadataModalSidebarTabsValue =
  | "general"
  | "seo"
  | "license"
  | "settings";

export const sidebar_tab_atom =
  atom_with_reset<StoryMetadataModalSidebarTabsValue>("general");
