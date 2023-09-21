import React from "react";

import EmojiPicker from "~/entities/EmojiPicker";
import MoodSmileIcon from "~/icons/MoodSmile";

import { useInsertTextEntity } from "../../../../../../../hooks/use-insert-text-entity";
import InsertItem from "../insert-item";

const EmojiItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insertEmoji] = useInsertTextEntity();
  return (
    <EmojiPicker onEmojiSelect={insertEmoji}>
      <InsertItem
        data-testid={"insert-emoji"}
        decorator={<MoodSmileIcon />}
        disabled={disabled}
        label={"Emoji"}
      />
    </EmojiPicker>
  );
};

export default EmojiItem;
