"use client";

import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import HandClickIcon from "~/icons/hand-click";

import { hovered_emoji_atom } from "../../atoms";
import { default as data } from "../../data.json";
import Emoji from "./emoji";
import styles from "./emoji.module.scss";

const HoveredEmoji = (): React.ReactElement => {
  const hovered_emoji = use_atom_value(hovered_emoji_atom);

  if (!hovered_emoji) {
    return <HandClickIcon />;
  }

  return (
    <span
      style={
        {
          "--sheet-cols": data.sheet.cols,
          "--sheet-rows": data.sheet.rows,
          "--sprite-size": `${100 * data.sheet.cols}% ${100 * data.sheet.rows}%`
        } as React.CSSProperties
      }
    >
      <Emoji className={styles.preview} emoji_id={hovered_emoji} />
    </span>
  );
};

export default HoveredEmoji;
