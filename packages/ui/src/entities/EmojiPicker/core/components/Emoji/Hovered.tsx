"use client";

import { useAtomValue } from "jotai";
import React from "react";

import HandClickIcon from "~/icons/HandClick";

import { hoveredEmojiAtom } from "../../atoms";
import data from "../../data.json";
import Emoji from "./Emoji";
import styles from "./Emoji.module.scss";

const HoveredEmoji = (): React.ReactElement => {
  const hoveredEmoji = useAtomValue(hoveredEmojiAtom);

  if (!hoveredEmoji) {
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
      <Emoji className={styles.preview} emojiId={hoveredEmoji} />
    </span>
  );
};

export default HoveredEmoji;
