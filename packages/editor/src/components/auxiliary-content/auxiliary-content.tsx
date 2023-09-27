import { clsx } from "clsx";
import { useAtomValue, useSetAtom } from "jotai";
import dynamic from "next/dynamic";
import React from "react";
import { useIntersectionObserver } from "react-intersection-observer-hook";

import { dynamicLoader } from "~/common/dynamic";
import Divider from "~/components/Divider";
import Option from "~/components/Option";
import Select from "~/components/Select";
import Spacer from "~/components/Spacer";
import Tab from "~/components/Tab";
import Tabs from "~/components/Tabs";
import TabsList from "~/components/TabsList";
import Typography from "~/components/Typography";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { use_app_selector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import { isAuxiliaryContentVisibleAtom, storyMetadataAtom } from "../../atoms";
import styles from "./auxiliary-content.module.scss";

const EditorAuxiliaryContentCommentList = dynamic(
  () => import("./comment-list"),
  {
    loading: dynamicLoader()
  }
);

const EditorAuxiliaryContentCommentListDisabledState = dynamic(
  () => import("./comment-list/disabled-state"),
  {
    loading: dynamicLoader()
  }
);

const EditorAuxiliaryContentSuggestionList = dynamic(
  () => import("./suggestion-list"),
  {
    loading: dynamicLoader()
  }
);

export type StoryCommentsSortValue = "likes-dsc" | "recent";
export type EditorAuxiliaryContentTabValue = "suggested" | "comments";

// Header tabs

const HeaderTabs = ({
  value,
  onChange
}: {
  onChange: (newValue: EditorAuxiliaryContentTabValue) => void;
  value: EditorAuxiliaryContentTabValue;
}): React.ReactElement => (
  <Tabs
    onValueChange={(newValue): void =>
      onChange(newValue as EditorAuxiliaryContentTabValue)
    }
    value={value}
  >
    <TabsList className={clsx("full-w", styles.x, styles["tabs-list"])}>
      <Tab aria-controls={undefined} value={"suggested"}>
        Suggested
      </Tab>
      <Tab aria-controls={undefined} value={"comments"}>
        Comments
      </Tab>
    </TabsList>
  </Tabs>
);

// Content

const Content = (): React.ReactElement => {
  const story = useAtomValue(storyMetadataAtom);
  const isSmallerThanDesktop = useMediaQuery(breakpoints.down("desktop"));
  const commentCount =
    use_app_selector((state) => state.entities.storyCommentCounts[story.id]) ||
    0;
  const [value, setValue] = React.useState<EditorAuxiliaryContentTabValue>(
    isSmallerThanDesktop ? "suggested" : "comments"
  );
  const [sort, setSort] = React.useState<StoryCommentsSortValue>("likes-dsc");

  const handleSortChange = React.useCallback(
    (nextSort: StoryCommentsSortValue) => {
      setSort(nextSort);
    },
    []
  );

  React.useEffect(() => {
    if (!isSmallerThanDesktop) {
      setValue("comments");
    }
  }, [isSmallerThanDesktop]);

  return (
    <React.Fragment>
      <header className={clsx("flex-col", styles.header)}>
        {isSmallerThanDesktop && (
          <HeaderTabs onChange={setValue} value={value} />
        )}
        {value === "comments" && (
          <div className={clsx("full-h", "flex-center")}>
            <Typography
              className={clsx(
                "t-bold",
                "f-grow",
                styles.x,
                styles["header-label"]
              )}
              level={"body2"}
            >
              {story.disable_comments ? "No" : abbreviateNumber(commentCount)}{" "}
              {commentCount === 1 ? "comment" : "comments"}
            </Typography>
            <Divider orientation={"vertical"} />
            <Select
              disabled={story.disable_comments}
              onValueChange={(nextValue): void =>
                handleSortChange(nextValue as StoryCommentsSortValue)
              }
              slot_props={{
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
              value={sort}
            >
              <Option value={"likes-dsc"}>Relevant</Option>
              <Option value={"recent"}>Recent</Option>
            </Select>
          </div>
        )}
      </header>
      <Spacer
        className={styles["header-spacer"]}
        orientation={"vertical"}
        size={5.25}
      />
      {value === "comments" && (
        <Spacer
          className={styles["header-spacer"]}
          orientation={"vertical"}
          size={4.75}
        />
      )}
      {value === "suggested" ? (
        <EditorAuxiliaryContentSuggestionList />
      ) : story.disable_comments ? (
        <EditorAuxiliaryContentCommentListDisabledState />
      ) : (
        <EditorAuxiliaryContentCommentList
          setSort={handleSortChange}
          sort={sort}
        />
      )}
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
      <section
        className={clsx("flex-col", styles["auxiliary-content"])}
        id={"auxiliary-content"}
        ref={ref}
      >
        <Content />
      </section>
    </React.Fragment>
  );
};

export default EditorAuxiliaryContent;
