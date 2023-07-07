"use client";

import React from "react";

import { EmojiPickerProps } from "./EmojiPicker.props";

export const EmojiPickerContext = React.createContext<
  Pick<EmojiPickerProps, "onEmojiSelect">
>({});
