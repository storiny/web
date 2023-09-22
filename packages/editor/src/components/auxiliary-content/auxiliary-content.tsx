import { clsx } from "clsx";
import { useAtomValue, useSetAtom } from "jotai";
import React from "react";
import { useIntersectionObserver } from "react-intersection-observer-hook";

import Avatar from "~/components/Avatar";
import Divider from "~/components/Divider";
import Option from "~/components/Option";
import Select from "~/components/Select";
import Typography from "~/components/Typography";
import ResponseTextarea from "~/entities/ResponseTextarea";
import { selectUser } from "~/redux/features";
import { useAppSelector } from "~/redux/hooks";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import { isAuxiliaryContentVisibleAtom, storyMetadataAtom } from "../../atoms";
import styles from "./auxiliary-content.module.scss";

// Content

const Content = (): React.ReactElement => {
  const story = useAtomValue(storyMetadataAtom);
  const user = useAppSelector(selectUser);
  const commentCount =
    useAppSelector((state) => state.entities.storyCommentCounts[story.id]) || 0;

  return (
    <React.Fragment>
      <header className={clsx("flex-center", styles.header)}>
        <Typography
          className={clsx("t-bold", "f-grow", styles.x, styles["header-label"])}
          level={"body2"}
        >
          {abbreviateNumber(commentCount)}{" "}
          {commentCount === 1 ? "comment" : "comments"}
        </Typography>
        <Divider orientation={"vertical"} />
        <Select
          slotProps={{
            trigger: {
              "aria-label": "Sort comments",
              className: clsx(
                "focus-invert",
                styles.x,
                styles["select-trigger"]
              )
            },
            value: {
              placeholder: "Sort"
            }
          }}
        >
          <Option value={"relevant"}>Relevant</Option>
          <Option value={"recent"}>Recent</Option>
        </Select>
      </header>
      <div className={clsx("flex", styles["response-area"])}>
        <Avatar
          alt={""}
          avatarId={user?.avatar_id}
          hex={user?.avatar_hex}
          label={user?.name}
        />
        <ResponseTextarea
          placeholder={"Leave a comment"}
          slotProps={{
            container: {
              className: "f-grow"
            }
          }}
        />
      </div>
    </React.Fragment>
  );
};

const EditorAuxiliaryContent = (): React.ReactElement => {
  const setIsAuxiliaryContentVisible = useSetAtom(
    isAuxiliaryContentVisibleAtom
  );
  const [ref, { entry }] = useIntersectionObserver({
    rootMargin: "-52px 0px 0px 0px"
  });

  React.useEffect(() => {
    setIsAuxiliaryContentVisible(Boolean(entry && entry.isIntersecting));
  }, [entry, setIsAuxiliaryContentVisible]);

  return (
    <React.Fragment>
      <Divider className={styles["content-divider"]} />
      <section
        className={clsx("flex-col", styles["auxiliary-content"])}
        ref={ref}
      >
        <Content />
      </section>
    </React.Fragment>
  );
};

export default EditorAuxiliaryContent;
