import { z } from "zod";

import { ZOD_MESSAGES } from "./messages";

/**
 * Alphanumeric regex
 */
export const USERNAME_REGEX = /^[\w_]+$/;
export const DEFAULT_WPM = 250;

export const userProps = {
  bio: {
    maxLength: 256
  },
  location: {
    maxLength: 36
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
      ZOD_MESSAGES.max("bio", userProps.bio.maxLength)
    ),
  location: z
    .string()
    .max(
      userProps.location.maxLength,
      ZOD_MESSAGES.max("location", userProps.location.maxLength)
    ),
  email: z
    .string()
    .min(
      userProps.email.minLength,
      ZOD_MESSAGES.min("e-mail", userProps.email.minLength)
    )
    .max(
      userProps.email.maxLength,
      ZOD_MESSAGES.max("e-mail", userProps.email.maxLength)
    )
    .email("Invalid e-mail")
    .nonempty(ZOD_MESSAGES.nonEmpty("e-mail")),
  name: z
    .string()
    .min(
      userProps.name.minLength,
      ZOD_MESSAGES.min("name", userProps.name.minLength)
    )
    .max(
      userProps.name.maxLength,
      ZOD_MESSAGES.max("name", userProps.name.maxLength)
    )
    .nonempty(ZOD_MESSAGES.nonEmpty("name")),
  password: z
    .string()
    .min(
      userProps.password.minLength,
      ZOD_MESSAGES.min("password", userProps.password.minLength)
    )
    .max(
      userProps.password.maxLength,
      ZOD_MESSAGES.max("password", userProps.password.maxLength)
    )
    .nonempty(ZOD_MESSAGES.nonEmpty("password")),
  username: z
    .string()
    .min(
      userProps.username.minLength,
      ZOD_MESSAGES.min("username", userProps.username.minLength)
    )
    .max(
      userProps.username.maxLength,
      ZOD_MESSAGES.max("username", userProps.username.maxLength)
    )
    .regex(
      USERNAME_REGEX,
      "Username must only contain underscores and alphanumeric characters"
    )
    .nonempty(ZOD_MESSAGES.nonEmpty("username")),
  wpm: z
    .number()
    .min(
      userProps.wpm.min,
      ZOD_MESSAGES.min("reading speed", userProps.wpm.min, "number")
    )
    .max(
      userProps.wpm.max,
      ZOD_MESSAGES.max("reading speed", userProps.wpm.max, "number")
    )
} as const;
