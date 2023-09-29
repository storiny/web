import { atomWithReset } from "jotai/utils";

import { StoryMetadataModalSidebarTabsValue } from "../sidebar-tab";

export type NavSegmentValue = StoryMetadataModalSidebarTabsValue | "home";

export const nav_segment_atom = atom_with_reset<NavSegmentValue>("home");
