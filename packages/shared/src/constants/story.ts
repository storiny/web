import { z } from "zod";

import { ZOD_MESSAGES } from "./messages";
import { TAG_SCHEMA } from "./tag";

export const MAX_STORY_TAGS = 5;
export const STORY_MAX_LENGTH = 60_000; // 5 (average chars/words in English) x 12k words

export enum StoryVisibility {
  UNLISTED /**/ = 0,
  PUBLIC /*  */ = 1
}

export enum StoryLicense {
  RESERVED /*   */ = 0,
  CC_BY /*      */ = 1,
  CC_BY_NC /*   */ = 2,
  CC_BY_NC_ND /**/ = 3,
  CC_BY_NC_SA /**/ = 4,
  CC_BY_ND /*   */ = 5,
  CC_BY_SA /*   */ = 6,
  CC_ZERO /*    */ = 7
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
    ),
  splashId: z.string().nullable(),
  splashHex: z.string().nullable(),
  tags: z
    .array(TAG_SCHEMA.name)
    .max(MAX_STORY_TAGS, ZOD_MESSAGES.max("tags", MAX_STORY_TAGS)),
  seoTitle: z
    .string()
    .max(
      STORY_PROPS.seoTitle.maxLength,
      ZOD_MESSAGES.max("seo title", STORY_PROPS.seoTitle.maxLength)
    )
    .nullable(),
  seoDescription: z
    .string()
    .max(
      STORY_PROPS.seoDescription.maxLength,
      ZOD_MESSAGES.max("seo description", STORY_PROPS.seoDescription.maxLength)
    )
    .nullable(),
  canonicalUrl: z
    .string()
    .url()
    .max(
      STORY_PROPS.canonicalUrl.maxLength,
      ZOD_MESSAGES.max("canonical url", STORY_PROPS.canonicalUrl.maxLength)
    )
    .nullable(),
  license: z.nativeEnum(StoryLicense),
  visibility: z.nativeEnum(StoryVisibility),
  ageRestriction: z.nativeEnum(StoryAgeRestriction),
  disableToc: z.boolean(),
  allowComments: z.boolean(),
  allowPublicRevisionHistory: z.boolean()
} as const;
