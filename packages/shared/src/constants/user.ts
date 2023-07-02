import { z } from "zod";

import { zodMessages } from "./messages";

/**
 * Alphanumeric regex
 */
export const USERNAME_REGEX = /^[\w_]+$/;
export const DEFAULT_WPM = 250;

export const userProps = {
  bio: {
    maxLength: 256
  },
  wpm: { min: 70, max: 320 },
  email: {
    maxLength: 112,
    minLength: 3
  },
  name: {
    minLength: 3,
    maxLength: 32
  },
  password: {
    maxLength: 64,
    minLength: 6
  },
  username: {
    maxLength: 24,
    minLength: 3
  }
} as const;

export const userSchema = {
  bio: z
    .string()
    .max(
      userProps.bio.maxLength,
      zodMessages.max("bio", userProps.bio.maxLength)
    ),
  email: z
    .string()
    .min(
      userProps.email.minLength,
      zodMessages.min("e-mail", userProps.email.minLength)
    )
    .max(
      userProps.email.maxLength,
      zodMessages.max("e-mail", userProps.email.maxLength)
    )
    .email("Invalid e-mail")
    .nonempty(zodMessages.nonEmpty("e-mail")),
  name: z
    .string()
    .min(
      userProps.name.minLength,
      zodMessages.min("name", userProps.name.minLength)
    )
    .max(
      userProps.name.maxLength,
      zodMessages.max("name", userProps.name.maxLength)
    )
    .nonempty(zodMessages.nonEmpty("name")),
  password: z
    .string()
    .min(
      userProps.password.minLength,
      zodMessages.min("password", userProps.password.minLength)
    )
    .max(
      userProps.password.maxLength,
      zodMessages.max("password", userProps.password.maxLength)
    )
    .nonempty(zodMessages.nonEmpty("password")),
  username: z
    .string()
    .min(
      userProps.username.minLength,
      zodMessages.min("username", userProps.username.minLength)
    )
    .max(
      userProps.username.maxLength,
      zodMessages.max("username", userProps.username.maxLength)
    )
    .regex(
      USERNAME_REGEX,
      "Username must only contain underscores and alphanumeric characters"
    )
    .nonempty(zodMessages.nonEmpty("username")),
  wpm: z
    .number()
    .min(
      userProps.wpm.min,
      zodMessages.min("reading speed", userProps.wpm.min, "number")
    )
    .max(
      userProps.wpm.max,
      zodMessages.max("reading speed", userProps.wpm.max, "number")
    )
} as const;
