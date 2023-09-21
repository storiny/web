import { z } from "zod";

import { StoryCategory } from "../enums";
import { ZOD_MESSAGES } from "./messages";
import { TAG_SCHEMA } from "./tag";

export const MAX_STORY_TAGS = 5;
export const STORY_MAX_LENGTH = 60_000; // 5 (average chars/words in English) x 12k words

export enum StoryVisibility {
  UNLISTED /**/ = 0,
  PUBLIC /*  */ = 1
}

export enum StoryLicense {
  CC_ZERO /*    */ = 0,
  RESERVED /*   */ = 1,
  CC_BY /*      */ = 2,
  CC_BY_SA /*   */ = 3,
  CC_BY_ND /*   */ = 4,
  CC_BY_NC /*   */ = 5,
  CC_BY_NC_SA /**/ = 6,
  CC_BY_NC_ND /**/ = 7
}

export enum StoryAgeRestriction {
  NOT_RATED /**/ = 0,
  RATED /*    */ = 1
}

export const STORY_PROPS = {
  title: {
    maxLength: 96,
    minLength: 1
  },
  description: {
    maxLength: 256
  },
  seoTitle: {
    maxLength: 54
  },
  seoDescription: {
    maxLength: 160
  },
  canonicalUrl: {
    maxLength: 1024
  }
} as const;

export const STORY_SCHEMA = {
  title: z
    .string()
    .min(
      STORY_PROPS.title.minLength,
      ZOD_MESSAGES.min("title", STORY_PROPS.title.minLength)
    )
    .max(
      STORY_PROPS.title.maxLength,
      ZOD_MESSAGES.max("title", STORY_PROPS.title.maxLength)
    )
    .nonempty(ZOD_MESSAGES.nonEmpty("title")),
  description: z
    .string()
    .max(
      STORY_PROPS.description.maxLength,
      ZOD_MESSAGES.max("description", STORY_PROPS.description.maxLength)
    )
    .nullable(),
  "splash-id": z.string().nullable(),
  "splash-hex": z.string().nullable(),
  "preview-image": z.string().nullable(),
  tags: z
    .array(TAG_SCHEMA.name)
    .max(MAX_STORY_TAGS, ZOD_MESSAGES.max("tags", MAX_STORY_TAGS)),
  "seo-title": z
    .string()
    .max(
      STORY_PROPS.seoTitle.maxLength,
      ZOD_MESSAGES.max("seo title", STORY_PROPS.seoTitle.maxLength)
    )
    .nullable(),
  "seo-description": z
    .string()
    .max(
      STORY_PROPS.seoDescription.maxLength,
      ZOD_MESSAGES.max("seo description", STORY_PROPS.seoDescription.maxLength)
    )
    .nullable(),
  "canonical-url": z
    .string()
    .url()
    .max(
      STORY_PROPS.canonicalUrl.maxLength,
      ZOD_MESSAGES.max("canonical url", STORY_PROPS.canonicalUrl.maxLength)
    )
    .nullable(),
  license: z.nativeEnum(StoryLicense),
  visibility: z.nativeEnum(StoryVisibility),
  "age-restriction": z.nativeEnum(StoryAgeRestriction),
  category: z.nativeEnum(StoryCategory),
  "disable-toc": z.boolean(),
  "disable-comments": z.boolean(),
  "disable-public-revision-history": z.boolean()
} as const;
