import { z } from "zod";

import {
  StoryAgeRestriction,
  StoryCategory,
  StoryLicense,
  StoryVisibility
} from "../../enums";
import { ZOD_MESSAGES } from "../messages";
import { TAG_SCHEMA } from "../tag";

export const MAX_STORY_TAGS = 5;
export const STORY_MAX_LENGTH = 60_000; // 5 (average chars/words in English) x 12k words

export const STORY_PROPS = {
  title: {
    max_length: 96,
    min_length: 1
  },
  description: {
    max_length: 256
  },
  seo_title: {
    max_length: 54
  },
  seo_description: {
    max_length: 160
  },
  canonical_url: {
    max_length: 1024
  }
} as const;

export const STORY_SCHEMA = {
  title: z
    .string()
    .min(
      STORY_PROPS.title.min_length,
      ZOD_MESSAGES.min("title", STORY_PROPS.title.min_length)
    )
    .max(
      STORY_PROPS.title.max_length,
      ZOD_MESSAGES.max("title", STORY_PROPS.title.max_length)
    )
    .nonempty(ZOD_MESSAGES.non_empty("title")),
  description: z
    .string()
    .max(
      STORY_PROPS.description.max_length,
      ZOD_MESSAGES.max("description", STORY_PROPS.description.max_length)
    )
    .nullable(),
  splash_id: z.string().nullable(),
  splash_hex: z.string().nullable(),
  preview_image: z.string().nullable(),
  tags: z
    .array(TAG_SCHEMA.name)
    .max(MAX_STORY_TAGS, ZOD_MESSAGES.max("tags", MAX_STORY_TAGS)),
  seo_title: z
    .string()
    .max(
      STORY_PROPS.seo_title.max_length,
      ZOD_MESSAGES.max("seo title", STORY_PROPS.seo_title.max_length)
    )
    .nullable(),
  seo_description: z
    .string()
    .max(
      STORY_PROPS.seo_description.max_length,
      ZOD_MESSAGES.max(
        "seo description",
        STORY_PROPS.seo_description.max_length
      )
    )
    .nullable(),
  canonical_url: z
    .string()
    .url()
    .max(
      STORY_PROPS.canonical_url.max_length,
      ZOD_MESSAGES.max("canonical url", STORY_PROPS.canonical_url.max_length)
    )
    .nullable(),
  license: z.nativeEnum(StoryLicense),
  visibility: z.nativeEnum(StoryVisibility),
  age_restriction: z.nativeEnum(StoryAgeRestriction),
  category: z.nativeEnum(StoryCategory),
  disable_toc: z.boolean(),
  disable_comments: z.boolean(),
  disable_public_revision_history: z.boolean()
} as const;
