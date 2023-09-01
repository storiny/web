import React from "react";

import MenubarItem from "~/components/MenubarItem";
import EmojiPicker from "~/entities/EmojiPicker";
import MoodSmileIcon from "~/icons/MoodSmile";

import { useInsertTextEntity } from "../../../../../../hooks/use-insert-text-entity";

const EmojiMenubarItem = (): React.ReactElement => {
  const [insertEmoji] = useInsertTextEntity();
  return (
    <EmojiPicker onEmojiSelect={insertEmoji} popoverProps={{ modal: true }}>
      <MenubarItem
        decorator={<MoodSmileIcon />}
        onSelect={(event): void => event.preventDefault()}
      >
        Emoji
      </MenubarItem>
    </EmojiPicker>
  );
};

export default EmojiMenubarItem;
