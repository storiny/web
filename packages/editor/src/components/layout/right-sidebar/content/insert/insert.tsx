import { clsx } from "clsx";
import React from "react";

import Button, { ButtonProps } from "~/components/Button";
import ScrollArea from "~/components/ScrollArea";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";

import CodeBlockItem from "./code-block";
import EmbedItem from "./embed";
import EmojiItem from "./emoji";
import HorizontalRuleItem from "./horizontal-rule";
import ImageItem from "./image";
import styles from "./insert.module.scss";
import SpecialCharacterItem from "./special-character";

const Insert = ({ disabled }: { disabled?: boolean }): React.ReactElement => (
  <div className={"flex-col"}>
    <Typography className={clsx("t-minor", "t-medium")} level={"body2"}>
      Insert
    </Typography>
    <Spacer orientation={"vertical"} size={2} />
    <ScrollArea
      slotProps={{
        viewport: { asChild: true }
      }}
    >
      <ul className={clsx("flex-col", styles.x, styles.viewport)}>
        <HorizontalRuleItem disabled={disabled} />
        <ImageItem disabled={disabled} />
        <CodeBlockItem disabled={disabled} />
        <EmbedItem disabled={disabled} />
        <EmojiItem disabled={disabled} />
        <SpecialCharacterItem disabled={disabled} />
      </ul>
    </ScrollArea>
  </div>
);

export default Insert;
