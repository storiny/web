import { clsx } from "clsx";
import { useAtom as use_atom, useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Link from "~/components/link";
import ScrollArea, { ScrollAreaProps } from "~/components/scroll-area";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { use_story_metadata_mutation } from "~/redux/features";

import { doc_status_atom, story_metadata_atom } from "../../../../../../atoms";
import TableOfContentsPlugin from "../../../../../../plugins/toc";
import styles from "./toc.module.scss";

const EditorToc = ({
  disabled,
  read_only
}: {
  disabled?: boolean;
  read_only?: boolean;
}): React.ReactElement => {
  const [story, set_story] = use_atom(story_metadata_atom);
  const [loading, set_loading] = React.useState<boolean>(false);
  const doc_status = use_atom_value(doc_status_atom);
  const publishing = doc_status === "publishing";
  const [mutate_story_metadata] = use_story_metadata_mutation();
  const on_change = React.useCallback(
    (next_value: boolean): void => {
      if (loading) {
        return;
      }

      set_loading(true);
      mutate_story_metadata({ id: story.id, disable_toc: next_value })
        .unwrap()
        .catch(() => undefined)
        .finally(() => set_loading(false));
    },
    [loading, story.id, mutate_story_metadata]
  );

  return (
    <div className={clsx("flex-col", read_only && "full-h")}>
      <div className={clsx("flex-center")}>
        <Typography className={clsx("t-minor", "t-medium")} level={"body2"}>
          Table of contents
        </Typography>
        <Spacer className={"f-grow"} />
        {!disabled && !read_only ? (
          <Link
            aria-label={"Disable table of contents"}
            disabled={publishing}
            href={"#"}
            level={"body2"}
            onClick={(): void => {
              const next_value = !story.disable_toc;
              set_story((prev) => ({ ...prev, disable_toc: next_value }));
              on_change(next_value);
            }}
            role={"button"}
            tabIndex={0}
            title={"Disable table of contents"}
            underline={"always"}
          >
            {story.disable_toc ? "Enable" : "Disable"}
          </Link>
        ) : null}
      </div>
      <Spacer orientation={"vertical"} size={2} />
      <ScrollArea
        className={clsx(read_only && "full-h")}
        slot_props={
          {
            viewport: {
              className: clsx(
                "flex-center",
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
