import { atomWithReset as atom_with_reset } from "jotai/utils";

export type StoryMetadataModalSidebarTabsValue =
  | "general"
  | "blog"
  | "seo"
  | "license"
  | "settings";

export const sidebar_tab_atom =
  atom_with_reset<StoryMetadataModalSidebarTabsValue>("general");
