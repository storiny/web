import { STORY_SCHEMA } from "@storiny/shared/src/constants/story";
import { z } from "zod";

export type StoryMetadataSchema = z.infer<typeof STORY_METADATA_SCHEMA>;

export const STORY_METADATA_SCHEMA = z.object({
  ...STORY_SCHEMA,
  blog_id: z.string().nullable()
});
