import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import ScrollArea, { ScrollAreaProps } from "~/components/scroll-area";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import { story_metadata_atom } from "../../../../../../atoms";
import TableOfContentsPlugin from "../../../../../../plugins/toc";
import styles from "./toc.module.scss";

const EditorToc = ({
  read_only
}: {
  read_only?: boolean;
}): React.ReactElement => {
  const story = use_atom_value(story_metadata_atom);

  return (
    <div className={clsx(css["flex-col"], read_only && css["full-h"])}>
      <div className={css["flex-center"]}>
        <Typography color={"minor"} level={"body2"} weight={"medium"}>
          Table of contents
        </Typography>
        <Spacer className={css["f-grow"]} />
      </div>
      <Spacer orientation={"vertical"} size={2} />
      <ScrollArea
        className={clsx(
          read_only && css["full-h"],
          styles.x,
          styles["scroll-area"]
        )}
        slot_props={
          {
            viewport: {
              className: clsx(
                css["flex-center"],
                styles.x,
                styles.viewport,
                read_only && styles["read-only"]
              ),
              "data-testid": "toc"
            },
            scrollbar: {
              style: {
                // eslint-disable-next-line prefer-snakecase/prefer-snakecase
                backgroundColor: "transparent"
              }
            }
          } as ScrollAreaProps["slot_props"]
        }
        type={"auto"}
      >
        {story.disable_toc ? (
          <Typography
            className={css["t-center"]}
            color={"muted"}
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
