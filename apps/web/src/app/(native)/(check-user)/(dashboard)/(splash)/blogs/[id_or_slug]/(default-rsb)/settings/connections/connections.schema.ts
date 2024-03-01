import { ZOD_MESSAGES } from "@storiny/shared";
import { z } from "zod";

export type BlogConnectionsSchema = z.infer<typeof BLOG_CONNECTIONS_SCHEMA>;

export const CONNECTION_VALUE_MAX_LENGTH = 1024;

const CONNECTION_URL = z
  .string()
  .url("Invalid URL")
  .max(
    CONNECTION_VALUE_MAX_LENGTH,
    ZOD_MESSAGES.max("URL", CONNECTION_VALUE_MAX_LENGTH)
  )
  .optional()
  .nullable()
  .or(z.literal(""));

export const BLOG_CONNECTIONS_SCHEMA = z.object({
  website_url: CONNECTION_URL,
  public_email: z
    .string()
    .email("Invalid e-mail")
    .max(
      CONNECTION_VALUE_MAX_LENGTH,
      ZOD_MESSAGES.max("e-mail", CONNECTION_VALUE_MAX_LENGTH)
    )
    .optional()
    .nullable()
    .or(z.literal("")),
  linkedin_url: CONNECTION_URL,
  youtube_url: CONNECTION_URL,
  twitch_url: CONNECTION_URL,
  instagram_url: CONNECTION_URL,
  twitter_url: CONNECTION_URL,
  github_url: CONNECTION_URL
});
