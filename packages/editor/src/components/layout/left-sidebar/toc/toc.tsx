import { clsx } from "clsx";
import { useAtom } from "jotai";
import React from "react";

import Link from "~/components/Link";
import ScrollArea from "~/components/ScrollArea";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";

import { tocDisabledAtom } from "../../../../atoms";
import TableOfContentsPlugin from "../../../../plugins/toc";
import styles from "./toc.module.scss";

const EditorToc = (): React.ReactElement => {
  const [tocDisabled, setTocDisabled] = useAtom(tocDisabledAtom);
  return (
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
          onClick={(): void => setTocDisabled((prev) => !prev)}
          role={"button"}
          tabIndex={0}
          title={"Disable table of contents"}
          underline={"always"}
        >
          {tocDisabled ? "Enable" : "Disable"}
        </Link>
      </div>
      <Spacer orientation={"vertical"} size={2} />
      <ScrollArea
        slotProps={{
          viewport: {
            className: clsx("flex-center", styles.x, styles.viewport)
          },
          scrollbar: {
            style: {
              backgroundColor: "transparent"
            }
          }
        }}
        type={"auto"}
      >
        {tocDisabled ? (
          <Typography
            className={clsx("t-muted", "t-center")}
            level={"body2"}
            style={{ display: "table-cell", verticalAlign: "middle" }}
          >
            Disabled
          </Typography>
        ) : (
          <TableOfContentsPlugin />
        )}
      </ScrollArea>
    </div>
  );
};

export default EditorToc;
