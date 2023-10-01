import { clsx } from "clsx";
import React from "react";

import ScrollArea from "~/components/scroll-area";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";

import CodeBlockItem from "./code-block";
import EmbedItem from "./embed";
import EmojiItem from "./emoji";
import HorizontalRuleItem from "./horizontal-rule";
import ImageItem from "./image";
import styles from "./insert.module.scss";
import SymbolItem from "./symbol";

const Insert = ({ disabled }: { disabled?: boolean }): React.ReactElement => (
  <div className={"flex-col"}>
    <Typography className={clsx("t-minor", "t-medium")} level={"body2"}>
      Insert
    </Typography>
    <Spacer orientation={"vertical"} size={2} />
    <ScrollArea
      slot_props={{
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
        viewport: { asChild: true }
      }}
    >
      <ul className={clsx("flex-col", styles.x, styles.viewport)}>
        <HorizontalRuleItem disabled={disabled} />
        <ImageItem disabled={disabled} />
        <CodeBlockItem disabled={disabled} />
        <EmbedItem disabled={disabled} />
        <EmojiItem disabled={disabled} />
        <SymbolItem disabled={disabled} />
      </ul>
    </ScrollArea>
  </div>
);

export default Insert;
