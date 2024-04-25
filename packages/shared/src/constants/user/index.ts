import { z } from "zod";

import { ZOD_MESSAGES } from "../messages";

/**
 * Alphanumeric and underscore regex
 */
export const USERNAME_REGEX = /^[\w_]+$/;
export const DEFAULT_WPM = 250;

export const USER_PROPS = {
  bio: {
    max_length: 256
  },
  location: {
    max_length: 36
  },
  wpm: { min: 70, max: 320 },
  email: {
    max_length: 300,
    min_length: 3
  },
  name: {
    min_length: 3,
    max_length: 32
  },
  password: {
    max_length: 64,
    min_length: 6
  },
  username: {
    max_length: 24,
    min_length: 3
  },
  status: {
    text: {
      max_length: 128
    }
  }
} as const;

export const USER_SCHEMA = {
  bio: z
    .string()
    .max(
      USER_PROPS.bio.max_length,
      ZOD_MESSAGES.max("bio", USER_PROPS.bio.max_length)
    ),
  location: z
    .string()
    .max(
      USER_PROPS.location.max_length,
      ZOD_MESSAGES.max("location", USER_PROPS.location.max_length)
    ),
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
    .email("Invalid e-mail"),
  name: z
    .string()
    .min(
      USER_PROPS.name.min_length,
      ZOD_MESSAGES.min("name", USER_PROPS.name.min_length)
    )
    .max(
      USER_PROPS.name.max_length,
      ZOD_MESSAGES.max("name", USER_PROPS.name.max_length)
    ),
  password: z
    .string()
    .min(
      USER_PROPS.password.min_length,
      ZOD_MESSAGES.min("password", USER_PROPS.password.min_length)
    )
    .max(
      USER_PROPS.password.max_length,
      ZOD_MESSAGES.max("password", USER_PROPS.password.max_length)
    ),
  username: z
    .string()
    .min(
      USER_PROPS.username.min_length,
      ZOD_MESSAGES.min("username", USER_PROPS.username.min_length)
    )
    .max(
      USER_PROPS.username.max_length,
      ZOD_MESSAGES.max("username", USER_PROPS.username.max_length)
    )
    .regex(
      USERNAME_REGEX,
      "Username must only contain underscores and alphanumeric characters"
    ),
  wpm: z
    .number()
    .min(
      USER_PROPS.wpm.min,
      ZOD_MESSAGES.min("reading speed", USER_PROPS.wpm.min, "number")
    )
    .max(
      USER_PROPS.wpm.max,
      ZOD_MESSAGES.max("reading speed", USER_PROPS.wpm.max, "number")
    ),
  status_text: z
    .string()
    .max(
      USER_PROPS.status.text.max_length,
      ZOD_MESSAGES.max("status text", USER_PROPS.status.text.max_length)
    )
    .nullable()
} as const;
