import React from "react";

import EmojiPicker from "~/entities/EmojiPicker";
import MoodSmileIcon from "~/icons/MoodSmile";

import { useInsertEmoji } from "../../../../../../hooks/use-insert-emoji";
import InsertItem from "../insert-item";

const EmojiItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insertEmoji] = useInsertEmoji();
  return (
    <EmojiPicker onEmojiSelect={insertEmoji}>
      <InsertItem
        decorator={<MoodSmileIcon />}
        disabled={disabled}
        label={"Emoji"}
      />
    </EmojiPicker>
  );
};

export default EmojiItem;
