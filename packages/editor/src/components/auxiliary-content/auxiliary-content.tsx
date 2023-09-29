import { clsx } from "clsx";
import { useAtomValue, useSetAtom } from "jotai";
import dynamic from "next/dynamic";
import React from "react";
import { useIntersectionObserver } from "react-intersection-observer-hook";

import { dynamicLoader } from "~/common/dynamic";
import Divider from "../../../../ui/src/components/divider";
import Option from "../../../../ui/src/components/option";
import Select from "../../../../ui/src/components/select";
import Spacer from "../../../../ui/src/components/spacer";
import Tab from "../../../../ui/src/components/tab";
import Tabs from "../../../../ui/src/components/tabs";
import TabsList from "../../../../ui/src/components/tabs-list";
import Typography from "../../../../ui/src/components/typography";
import { use_media_query } from "../../../../ui/src/hooks/use-media-query";
import { use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { abbreviate_number } from "../../../../ui/src/utils/abbreviate-number";

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
  const story = use_atom_value(storyMetadataAtom);
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));
  const commentCount =
    use_app_selector((state) => state.entities.storyCommentCounts[story.id]) ||
    0;
  const [value, setValue] = React.useState<EditorAuxiliaryContentTabValue>(
    is_smaller_than_desktop ? "suggested" : "comments"
  );
  const [sort, setSort] = React.useState<StoryCommentsSortValue>("likes-dsc");

  const handleSortChange = React.useCallback(
    (nextSort: StoryCommentsSortValue) => {
      setSort(nextSort);
    },
    []
  );

  React.useEffect(() => {
    if (!is_smaller_than_desktop) {
      setValue("comments");
    }
  }, [is_smaller_than_desktop]);

  return (
    <React.Fragment>
      <header className={clsx("flex-col", styles.header)}>
        {is_smaller_than_desktop && (
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
              {story.disable_comments ? "No" : abbreviate_number(commentCount)}{" "}
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
  const setIsAuxiliaryContentVisible = use_set_atom(
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
