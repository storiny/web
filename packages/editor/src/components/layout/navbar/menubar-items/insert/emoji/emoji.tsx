import React from "react";

import MenubarItem from "~/components/menubar-item";
import EmojiPicker from "~/entities/emoji-picker";
import MoodSmileIcon from "~/icons/mood-smile";

import { use_insert_text_entity } from "../../../../../../hooks/use-insert-text-entity";

const EmojiMenubarItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insert_emoji] = use_insert_text_entity();
  return (
    <EmojiPicker on_emoji_select={insert_emoji} popover_props={{ modal: true }}>
      <MenubarItem
        decorator={<MoodSmileIcon />}
        disabled={disabled}
        onSelect={(event): void => event.preventDefault()}
      >
        Emoji
      </MenubarItem>
    </EmojiPicker>
  );
};

export default EmojiMenubarItem;
