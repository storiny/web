import { USER_PROPS, ZOD_MESSAGES } from "@storiny/shared";
import { z } from "zod";

export type NewsletterSubscribeSchema = z.infer<
  typeof NEWSLETTER_SUBSCRIBE_SCHEMA
>;

export const NEWSLETTER_SUBSCRIBE_SCHEMA = z.object({
  email: z
    .string()
    .min(
      USER_PROPS.email.min_length,
      ZOD_MESSAGES.min("e-mail", USER_PROPS.email.min_length)
    )
    .max(
      USER_PROPS.email.max_length,
      ZOD_MESSAGES.max("e-mail", USER_PROPS.email.max_length)
    )
    .email("Invalid e-mail")
});
