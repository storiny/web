import { clsx } from "clsx";
import React from "react";

import Button from "~/components/Button";
import ScrollArea from "~/components/ScrollArea";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import CodeBlockIcon from "~/icons/CodeBlock";
import EmbedIcon from "~/icons/Embed";
import HorizontalRuleIcon from "~/icons/HorizontalRule";
import ImageIcon from "~/icons/Image";
import MoodSmileIcon from "~/icons/MoodSmile";
import OmegaIcon from "~/icons/Omega";

import styles from "./insert.module.scss";

const Item = ({
  decorator,
  label,
  disabled
}: {
  decorator: React.ReactNode;
  disabled?: boolean;
  label: React.ReactNode;
}): React.ReactElement => (
  <Button
    as={"li"}
    className={clsx("focus-invert", styles.x, styles.item)}
    disabled={disabled}
    variant={"ghost"}
  >
    <span className={clsx("flex-center", styles.x, styles.icon)}>
      {decorator}
    </span>
    <Typography
      as={"span"}
      className={clsx(styles.x, styles.label)}
      ellipsis
      level={"body2"}
    >
      {label}
    </Typography>
  </Button>
);

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
        <Item
          decorator={<HorizontalRuleIcon />}
          disabled={disabled}
          label={"Horizontal rule"}
        />
        <Item decorator={<ImageIcon />} disabled={disabled} label={"Image"} />
        <Item
          decorator={<CodeBlockIcon />}
          disabled={disabled}
          label={"Code block"}
        />
        <Item decorator={<EmbedIcon />} disabled={disabled} label={"Embed"} />
        <Item
          decorator={<MoodSmileIcon />}
          disabled={disabled}
          label={"Emoji"}
        />
        <Item
          decorator={<OmegaIcon />}
          disabled={disabled}
          label={"Special character"}
        />
      </ul>
    </ScrollArea>
  </div>
);

export default Insert;
