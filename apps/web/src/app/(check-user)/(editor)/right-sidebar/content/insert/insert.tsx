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
  label
}: {
  decorator: React.ReactNode;
  label: React.ReactNode;
}): React.ReactElement => (
  <Button
    as={"li"}
    className={clsx("focus-invert", styles.x, styles.item)}
    variant={"ghost"}
  >
    <span className={clsx("flex-center", styles.x, styles.icon)}>
      {decorator}
    </span>
    <Typography level={"body2"}>{label}</Typography>
  </Button>
);

const Insert = (): React.ReactElement => (
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
        <Item decorator={<HorizontalRuleIcon />} label={"Horizontal rule"} />
        <Item decorator={<ImageIcon />} label={"Image"} />
        <Item decorator={<CodeBlockIcon />} label={"Code block"} />
        <Item decorator={<EmbedIcon />} label={"Embed"} />
        <Item decorator={<MoodSmileIcon />} label={"Emoji"} />
        <Item decorator={<OmegaIcon />} label={"Special character"} />
      </ul>
    </ScrollArea>
  </div>
);

export default Insert;
