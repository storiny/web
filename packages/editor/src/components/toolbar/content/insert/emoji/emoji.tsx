import React from "react";

import MenuItem from "~/components/MenuItem";
import EmojiPicker from "~/entities/EmojiPicker";
import MoodSmileIcon from "~/icons/MoodSmile";

import { useInsertEmoji } from "../../../../../hooks/use-insert-emoji";

const EmojiMenuItem = (): React.ReactElement => {
  const [insertEmoji] = useInsertEmoji();
  return (
    <EmojiPicker onEmojiSelect={insertEmoji} popoverProps={{ modal: true }}>
      <MenuItem
        decorator={<MoodSmileIcon />}
        onSelect={(event): void => event.preventDefault()}
      >
        Emoji
      </MenuItem>
    </EmojiPicker>
  );
};

export default EmojiMenuItem;
