import { z } from "zod";

import { ZOD_MESSAGES } from "./messages";

export const REPLY_PROPS = {
  content: {
    maxLength: 1024,
    minLength: 1
  }
} as const;
