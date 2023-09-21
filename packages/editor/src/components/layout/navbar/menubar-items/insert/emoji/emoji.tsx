import React from "react";

import MenubarItem from "~/components/MenubarItem";
import EmojiPicker from "~/entities/EmojiPicker";
import MoodSmileIcon from "~/icons/MoodSmile";

import { useInsertTextEntity } from "../../../../../../hooks/use-insert-text-entity";

const EmojiMenubarItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insertEmoji] = useInsertTextEntity();
  return (
    <EmojiPicker onEmojiSelect={insertEmoji} popoverProps={{ modal: true }}>
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
