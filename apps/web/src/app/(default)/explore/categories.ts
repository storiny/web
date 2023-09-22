import { StoryCategory } from "@storiny/shared";

export const CATEGORIES: Array<"all" | StoryCategory> = [
  "all",
  ...Object.values(StoryCategory)
];
