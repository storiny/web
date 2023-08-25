import { clsx } from "clsx";
import React from "react";

import Link from "~/components/Link";
import ScrollArea from "~/components/ScrollArea";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";

import styles from "./toc.module.scss";

const EditorToc = (): React.ReactElement => (
  <div className={"flex-col"}>
    <div className={clsx("flex-center")}>
      <Typography className={clsx("t-minor", "t-medium")} level={"body2"}>
        Table of contents
      </Typography>
      <Spacer className={"f-grow"} />
      <Link
        aria-label={"Disable table of contents"}
        href={"#"}
        level={"body2"}
        title={"Disable table of contents"}
        underline={"always"}
      >
        Disable
      </Link>
    </div>
    <Spacer orientation={"vertical"} size={2} />
    <ScrollArea
      slotProps={{
        viewport: {
          className: clsx("flex-center", styles.x, styles.viewport)
        }
      }}
    >
      <Typography className={clsx("t-muted", "t-center")} level={"body2"}>
        Empty
      </Typography>
    </ScrollArea>
  </div>
);

export default EditorToc;
