import { z } from "zod";

export type StoryMetadataSchema = z.infer<typeof storyMetadataSchema>;

export const storyMetadataSchema = z.object({
  title: z.string()
});
