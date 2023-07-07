"use client";

import clsx from "clsx";
import { useAtomValue, useSetAtom } from "jotai";
import React from "react";

import { EmojiPickerContext } from "~/entities/EmojiPicker";
import { capitalize } from "~/utils/capitalize";

import { hoveredEmojiAtom, skinToneAtom } from "../../atoms";
import { SkinTone } from "../../constants";
import data from "../../data.json";
import styles from "./Emoji.module.scss";
import { EmojiProps } from "./Emoji.props";

const EMOJI_MAP = data.emojis;

const skinToneToIndexMap: Record<SkinTone, number> = {
  [SkinTone.DARK]: 5,
  [SkinTone.DEFAULT]: 6,
  [SkinTone.LIGHT]: 1,
  [SkinTone.MEDIUM]: 3,
  [SkinTone.MEDIUM_DARK]: 4,
  [SkinTone.MEDIUM_LIGHT]: 2
};

// Fake emoji

const FakeEmoji = React.memo(
  (props: React.ComponentPropsWithoutRef<"span">): React.ReactElement => {
    const { className, ...rest } = props;
    return (
      <span
        {...rest}
        aria-hidden
        className={clsx(styles["fake-emoji"], className)}
      />
    );
  }
);

FakeEmoji.displayName = "FakeEmoji";

const Emoji = (props: EmojiProps): React.ReactElement => {
  const { emojiId, className, style, ...rest } = props;
  const { onEmojiSelect } = React.useContext(EmojiPickerContext) || {};
  const skinTone = useAtomValue(skinToneAtom);
  const setHovered = useSetAtom(hoveredEmojiAtom);
  const emoji = EMOJI_MAP[emojiId];

  if (!emoji) {
    return <FakeEmoji />;
  }

  const activeSkin = skinToneToIndexMap[skinTone.hover || skinTone.active];
  const emojiSkin = emoji.skins[activeSkin] || emoji.skins[0];

  return (
    <button
      {...rest}
      aria-label={emojiSkin.native}
      className={clsx("focusable", styles.emoji, className)}
      onClick={(): void => onEmojiSelect?.(emoji.id as any)}
      onMouseEnter={(): void => setHovered(emoji.id as any)}
      onMouseLeave={(): void => setHovered(null)}
      style={
        {
          ...style,
          "--pos-y": emojiSkin.y,
          "--pos-x": emojiSkin.x
        } as React.CSSProperties
      }
      title={capitalize(emoji.name)}
    />
  );
};

export default React.memo(Emoji);
