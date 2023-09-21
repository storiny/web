import { STORY_SCHEMA } from "@storiny/shared/src/constants/story";
import { z } from "zod";

export type StoryMetadataSchema = z.infer<typeof storyMetadataSchema>;

export const storyMetadataSchema = z.object(STORY_SCHEMA);
