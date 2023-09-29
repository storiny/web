"use client";

import React from "react";

import { EmojiPickerProps } from "./emoji-picker.props";

export const EmojiPickerContext = React.createContext<
  Pick<EmojiPickerProps, "on_emoji_select">
>({});
