import { z } from "zod";

import { StoryCategory } from "../../enums";
import { ZOD_MESSAGES } from "../messages";

/**
 * Alphanumeric, underscore and hyphen regex
 */
export const BLOG_SLUG_REGEX = /^[\w_-]+$/;

export const BLOG_PROPS = {
  description: {
    max_length: 256
  },
  public_email: {
    max_length: 300,
    min_length: 3
  },
  name: {
    min_length: 3,
    max_length: 32
  },
  slug: {
    max_length: 24,
    min_length: 3
  },
  seo_title: {
    max_length: 54
  },
  seo_description: {
    max_length: 160
  }
} as const;

export const BLOG_SCHEMA = {
  description: z
    .string()
    .max(
      BLOG_PROPS.description.max_length,
      ZOD_MESSAGES.max("description", BLOG_PROPS.description.max_length)
    )
    .nullable(),
  email: z
    .string()
    .min(
      BLOG_PROPS.public_email.min_length,
      ZOD_MESSAGES.min("e-mail", BLOG_PROPS.public_email.min_length)
    )
    .max(
      BLOG_PROPS.public_email.max_length,
      ZOD_MESSAGES.max("e-mail", BLOG_PROPS.public_email.max_length)
    )
    .email("Invalid e-mail")
    .nonempty(ZOD_MESSAGES.non_empty("e-mail")),
  name: z
    .string()
    .min(
      BLOG_PROPS.name.min_length,
      ZOD_MESSAGES.min("name", BLOG_PROPS.name.min_length)
    )
    .max(
      BLOG_PROPS.name.max_length,
      ZOD_MESSAGES.max("name", BLOG_PROPS.name.max_length)
    )
    .nonempty(ZOD_MESSAGES.non_empty("name")),
  slug: z
    .string()
    .min(
      BLOG_PROPS.slug.min_length,
      ZOD_MESSAGES.min("slug", BLOG_PROPS.slug.min_length)
    )
    .max(
      BLOG_PROPS.slug.max_length,
      ZOD_MESSAGES.max("slug", BLOG_PROPS.slug.max_length)
    )
    .regex(
      BLOG_SLUG_REGEX,
      "Slug must only contain underscores, hyphens, and alphanumeric characters"
    )
    .nonempty(ZOD_MESSAGES.non_empty("slug")),
  logo_id: z.string().nullable(),
  logo_hex: z.string().nullable(),
  banner_id: z.string().nullable(),
  banner_hex: z.string().nullable(),
  newsletter_splash_hex: z.string().nullable(),
  newsletter_splash_id: z.string().nullable(),
  mark_dark: z.string().nullable(),
  mark_light: z.string().nullable(),
  preview_image: z.string().nullable(),
  seo_title: z
    .string()
    .max(
      BLOG_PROPS.seo_title.max_length,
      ZOD_MESSAGES.max("seo title", BLOG_PROPS.seo_title.max_length)
    )
    .nullable(),
  seo_description: z
    .string()
    .max(
      BLOG_PROPS.seo_description.max_length,
      ZOD_MESSAGES.max("seo description", BLOG_PROPS.seo_description.max_length)
    )
    .nullable(),
  category: z.nativeEnum(StoryCategory)
} as const;
