import React from "react";

import MenuItem from "../../../../../../../ui/src/components/menu-item";
import EmojiPicker from "../../../../../../../ui/src/entities/emoji-picker";
import MoodSmileIcon from "~/icons/MoodSmile";

import { useInsertTextEntity } from "../../../../../hooks/use-insert-text-entity";

const EmojiMenuItem = (): React.ReactElement => {
  const [insertEmoji] = useInsertTextEntity();
  return (
    <EmojiPicker on_emoji_select={insertEmoji} popover_props={{ modal: true }}>
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
