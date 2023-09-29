import React from "react";

import EmojiPicker from "../../../../../../../../../ui/src/entities/emoji-picker";
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
    <EmojiPicker on_emoji_select={insertEmoji}>
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
