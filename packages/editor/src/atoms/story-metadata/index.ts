import { DocUserRole, Story } from "@storiny/types";
import { atom } from "jotai";

export type StoryMetadata = Story & {
  is_writer: boolean;
  role: DocUserRole;
};

export const story_metadata_atom = atom<StoryMetadata>({} as StoryMetadata);
