import React from "react";

import EmojiPicker from "~/entities/emoji-picker";
import MoodSmileIcon from "~/icons/mood-smile";

import { use_insert_text_entity } from "../../../../../../../hooks/use-insert-text-entity";
import InsertItem from "../insert-item";

const EmojiItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insert_emoji] = use_insert_text_entity();
  return (
    <EmojiPicker on_emoji_select={({ native }): void => insert_emoji(native)}>
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
