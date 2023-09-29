import React from "react";

import MenuItem from "../../../../../../../ui/src/components/menu-item";
import EmojiPicker from "../../../../../../../ui/src/entities/emoji-picker";
import MoodSmileIcon from "../../../../../../../ui/src/icons/mood-smile";

import { use_insert_text_entity } from "../../../../../hooks/use-insert-text-entity";

const EmojiMenuItem = (): React.ReactElement => {
  const [insert_emoji] = use_insert_text_entity();
  return (
    <EmojiPicker on_emoji_select={insert_emoji} popover_props={{ modal: true }}>
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
