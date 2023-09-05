import React from "react";

import EmbedIcon from "~/icons/Embed";

import { useInsertEmbed } from "../../../../../../hooks/use-insert-embed";
import InsertItem from "../insert-item";

const EmbedItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insertEmbed] = useInsertEmbed();
  return (
    <InsertItem
      decorator={<EmbedIcon />}
      disabled={disabled}
      label={"Embed"}
      onClick={(): void =>
        insertEmbed({ url: "https://twitter.com/jack/status/20" })
      }
    />
  );
};

export default EmbedItem;
