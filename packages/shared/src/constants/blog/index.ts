import { z } from "zod";

import { StoryCategory } from "../../enums";
import { ZOD_MESSAGES } from "../messages";

/**
 * The variable set on the `window` object that holds the default theme value
 * for the blog.
 */
export const BLOG_GLOBAL_THEME_VARIABLE = "__STORINY_DEFAULT_BLOG_THEME__";

/**
 * Alphanumeric, underscore and hyphen regex
 */
export const BLOG_SLUG_REGEX = /^[\w_-]+$/;

/**
 * Regex for matching valid root-level domains and sub-domains
 */
export const BLOG_DOMAIN_REGEX = /[a-z0-9]+([-.][a-z0-9]+)*\.[a-z]{2,24}$/;

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
  domain: {
    min_length: 3,
    max_length: 512
  },
  seo_title: {
    max_length: 54
  },
  seo_description: {
    max_length: 160
  }
} as const;

export const LSB_ITEM_PROPS = {
  name: {
    min_length: 1,
    max_length: 32
  },
  target: {
    min_length: 6,
    max_length: 1024
  }
} as const;

export const RSB_ITEM_PROPS = {
  primary_text: {
    min_length: 1,
    max_length: 32
  },
  secondary_text: {
    max_length: 32
  },
  target: {
    min_length: 6,
    max_length: 1024
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
    .email("Invalid e-mail"),
  name: z
    .string()
    .min(
      BLOG_PROPS.name.min_length,
      ZOD_MESSAGES.min("name", BLOG_PROPS.name.min_length)
    )
    .max(
      BLOG_PROPS.name.max_length,
      ZOD_MESSAGES.max("name", BLOG_PROPS.name.max_length)
    ),
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
    ),
  domain: z
    .string()
    .min(
      BLOG_PROPS.domain.min_length,
      ZOD_MESSAGES.min("domain", BLOG_PROPS.domain.min_length)
    )
    .max(
      BLOG_PROPS.domain.max_length,
      ZOD_MESSAGES.max("domain", BLOG_PROPS.domain.max_length)
    )
    .regex(BLOG_DOMAIN_REGEX, "Invalid domain name"),
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

export const LSB_ITEM_SCHEMA = {
  name: z
    .string()
    .min(
      LSB_ITEM_PROPS.name.min_length,
      ZOD_MESSAGES.min("name", LSB_ITEM_PROPS.name.min_length)
    )
    .max(
      LSB_ITEM_PROPS.name.max_length,
      ZOD_MESSAGES.max("name", LSB_ITEM_PROPS.name.max_length)
    ),
  icon: z.string().nullable(),
  target: z
    .string()
    .url("Invalid URL")
    .max(
      LSB_ITEM_PROPS.target.max_length,
      ZOD_MESSAGES.max("URL", LSB_ITEM_PROPS.target.max_length)
    )
    .or(z.literal("/")) // Allow homepage
} as const;

export const RSB_ITEM_SCHEMA = {
  primary_text: z
    .string()
    .min(
      RSB_ITEM_PROPS.primary_text.min_length,
      ZOD_MESSAGES.min("primary text", RSB_ITEM_PROPS.primary_text.min_length)
    )
    .max(
      RSB_ITEM_PROPS.primary_text.max_length,
      ZOD_MESSAGES.max("primary text", RSB_ITEM_PROPS.primary_text.max_length)
    ),
  secondary_text: z
    .string()
    .max(
      RSB_ITEM_PROPS.secondary_text.max_length,
      ZOD_MESSAGES.max(
        "secondary text",
        RSB_ITEM_PROPS.secondary_text.max_length
      )
    )
    .nullable(),
  icon: z.string().nullable(),
  target: z
    .string()
    .url("Invalid URL")
    .max(
      LSB_ITEM_PROPS.target.max_length,
      ZOD_MESSAGES.max("URL", LSB_ITEM_PROPS.target.max_length)
    )
} as const;
