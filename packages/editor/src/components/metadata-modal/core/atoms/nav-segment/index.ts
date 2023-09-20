import { atomWithReset } from "jotai/utils";

import { StoryMetadataModalSidebarTabsValue } from "../sidebar-tab";

export type NavSegmentValue = StoryMetadataModalSidebarTabsValue | "home";

export const navSegmentAtom = atomWithReset<NavSegmentValue>("home");
