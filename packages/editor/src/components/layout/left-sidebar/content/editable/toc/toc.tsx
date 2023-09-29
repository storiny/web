import { clsx } from "clsx";
import { useAtom, useAtomValue } from "jotai";
import React from "react";

import Link from "../../../../../../../../ui/src/components/link";
import ScrollArea, {
  ScrollAreaProps
} from "../../../../../../../../ui/src/components/scroll-area";
import Spacer from "../../../../../../../../ui/src/components/spacer";
import Typography from "../../../../../../../../ui/src/components/typography";
import { use_story_metadata_mutation } from "~/redux/features";

import { docStatusAtom, storyMetadataAtom } from "../../../../../../atoms";
import TableOfContentsPlugin from "../../../../../../plugins/toc";
import styles from "./toc.module.scss";

const EditorToc = ({
  disabled,
  readOnly
}: {
  disabled?: boolean;
  readOnly?: boolean;
}): React.ReactElement => {
  const [story, setStory] = use_atom(storyMetadataAtom);
  const [loading, setLoading] = React.useState<boolean>(false);
  const docStatus = use_atom_value(docStatusAtom);
  const publishing = docStatus === "publishing";
  const [mutateStoryMetadata] = use_story_metadata_mutation();
  const onChange = React.useCallback(
    (nextValue: boolean): void => {
      if (loading) {
        return;
      }

      setLoading(true);
      mutateStoryMetadata({ id: story.id, "disable-toc": nextValue })
        .unwrap()
        .catch(() => undefined)
        .finally(() => setLoading(false));
    },
    [loading, story.id, mutateStoryMetadata]
  );

  return (
    <div className={clsx("flex-col", readOnly && "full-h")}>
      <div className={clsx("flex-center")}>
        <Typography className={clsx("t-minor", "t-medium")} level={"body2"}>
          Table of contents
        </Typography>
        <Spacer className={"f-grow"} />
        {!disabled && !readOnly ? (
          <Link
            aria-label={"Disable table of contents"}
            disabled={publishing}
            href={"#"}
            level={"body2"}
            onClick={(): void => {
              const prevValue = story.disable_toc;
              setStory((prev) => ({ ...prev, disable_toc: !prevValue }));
              onChange(!prevValue);
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
        className={clsx(readOnly && "full-h")}
        slot_props={
          {
            viewport: {
              className: clsx(
                "flex-center",
                styles.x,
                styles.viewport,
                readOnly && styles["read-only"]
              ),
              "data-testid": "toc"
            },
            scrollbar: {
              style: {
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
