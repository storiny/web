"use client";

import clsx from "clsx";
import {
  useAtomValue as use_atom_value,
  useSetAtom as use_set_atom
} from "jotai";
import React from "react";
import { EmojiPickerContext } from "src/entities/emoji-picker";

import { capitalize } from "~/utils/capitalize";

import { hovered_emoji_atom, skin_tone_atom } from "../../atoms";
import { SkinTone } from "../../constants";
import { default as data } from "../../data.json";
import styles from "./emoji.module.scss";
import { EmojiProps } from "./emoji.props";

const EMOJI_MAP = data.emojis;
const SKIN_TONE_INDEX_MAP: Record<SkinTone, number> = {
  [SkinTone.DARK /*        */]: 5,
  [SkinTone.DEFAULT /*     */]: 6,
  [SkinTone.LIGHT /*       */]: 1,
  [SkinTone.MEDIUM /*      */]: 3,
  [SkinTone.MEDIUM_DARK /* */]: 4,
  [SkinTone.MEDIUM_LIGHT /**/]: 2
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
  const { emoji_id, className, style, ...rest } = props;
  const { on_emoji_select } = React.useContext(EmojiPickerContext) || {};
  const skin_tone = use_atom_value(skin_tone_atom);
  const set_hovered = use_set_atom(hovered_emoji_atom);
  const emoji = EMOJI_MAP[emoji_id];

  if (!emoji) {
    return <FakeEmoji />;
  }

  const active_skin = SKIN_TONE_INDEX_MAP[skin_tone.hover || skin_tone.active];
  const emoji_skin = emoji.skins[active_skin] || emoji.skins[0];

  return (
    <button
      {...rest}
      aria-label={emoji_skin.native}
      className={clsx("focusable", styles.emoji, className)}
      onClick={(): void => on_emoji_select?.(emoji_skin.native)}
      onMouseEnter={(): void => set_hovered(emoji.id as any)}
      onMouseLeave={(): void => set_hovered(null)}
      style={
        {
          ...style,
          "--pos-y": emoji_skin.y,
          "--pos-x": emoji_skin.x
        } as React.CSSProperties
      }
      title={capitalize(emoji.name)}
    />
  );
};

export default React.memo(Emoji);
