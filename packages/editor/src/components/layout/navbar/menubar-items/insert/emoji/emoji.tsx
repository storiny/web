import React from "react";

import MenubarItem from "~/components/MenubarItem";
import EmojiPicker from "~/entities/EmojiPicker";
import MoodSmileIcon from "~/icons/MoodSmile";

import { useInsertEmoji } from "../../../../../../hooks/use-insert-emoji";

const EmojiMenubarItem = (): React.ReactElement => {
  const [insertEmoji] = useInsertEmoji();
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
