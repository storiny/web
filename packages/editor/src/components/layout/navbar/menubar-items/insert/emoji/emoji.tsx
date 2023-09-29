import React from "react";

import MenubarItem from "../../../../../../../../ui/src/components/menubar-item";
import EmojiPicker from "../../../../../../../../ui/src/entities/emoji-picker";
import MoodSmileIcon from "~/icons/MoodSmile";

import { useInsertTextEntity } from "../../../../../../hooks/use-insert-text-entity";

const EmojiMenubarItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insertEmoji] = useInsertTextEntity();
  return (
    <EmojiPicker on_emoji_select={insertEmoji} popover_props={{ modal: true }}>
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
