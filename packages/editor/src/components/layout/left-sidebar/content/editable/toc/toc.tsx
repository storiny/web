import { clsx } from "clsx";
import { useAtom } from "jotai";
import { useAtomValue } from "jotai/index";
import React from "react";

import Link from "~/components/Link";
import ScrollArea, { ScrollAreaProps } from "~/components/ScrollArea";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";

import { docStatusAtom, storyMetadataAtom } from "../../../../../../atoms";
import TableOfContentsPlugin from "../../../../../../plugins/toc";
import styles from "./toc.module.scss";

const EditorToc = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [story, setStory] = useAtom(storyMetadataAtom);
  const docStatus = useAtomValue(docStatusAtom);
  const publishing = docStatus === "publishing";

  return (
    <div className={"flex-col"}>
      <div className={clsx("flex-center")}>
        <Typography className={clsx("t-minor", "t-medium")} level={"body2"}>
          Table of contents
        </Typography>
        <Spacer className={"f-grow"} />
        {!disabled && (
          <Link
            aria-label={"Disable table of contents"}
            disabled={publishing}
            href={"#"}
            level={"body2"}
            onClick={(): void =>
              setStory((prev) => ({ ...prev, disable_toc: !prev.disable_toc }))
            }
            role={"button"}
            tabIndex={0}
            title={"Disable table of contents"}
            underline={"always"}
          >
            {story.disable_toc ? "Enable" : "Disable"}
          </Link>
        )}
      </div>
      <Spacer orientation={"vertical"} size={2} />
      <ScrollArea
        slotProps={
          {
            viewport: {
              className: clsx("flex-center", styles.x, styles.viewport),
              "data-testid": "toc"
            },
            scrollbar: {
              style: {
                backgroundColor: "transparent"
              }
            }
          } as ScrollAreaProps["slotProps"]
        }
        type={"auto"}
      >
        {story.disable_toc ? (
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
