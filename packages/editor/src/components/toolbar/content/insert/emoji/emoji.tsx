import React from "react";

import MenuItem from "~/components/MenuItem";
import EmojiPicker from "~/entities/EmojiPicker";
import MoodSmileIcon from "~/icons/MoodSmile";

import { useInsertTextEntity } from "../../../../../hooks/use-insert-text-entity";

const EmojiMenuItem = (): React.ReactElement => {
  const [insertEmoji] = useInsertTextEntity();
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
