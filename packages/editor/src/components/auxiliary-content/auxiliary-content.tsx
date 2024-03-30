"use client";

import { clsx } from "clsx";
import {
  useAtomValue as use_atom_value,
  useSetAtom as use_set_atom
} from "jotai";
import dynamic from "next/dynamic";
import React from "react";
import { useIntersectionObserver as use_intersection_observer } from "react-intersection-observer-hook";

import { use_blog_context } from "~/common/context/blog";
import { dynamic_loader } from "~/common/dynamic";
import Divider from "~/components/divider";
import NoSsr from "~/components/no-ssr";
import Option from "~/components/option";
import Select from "~/components/select";
import Spacer from "~/components/spacer";
import Tab from "~/components/tab";
import Tabs from "~/components/tabs";
import TabsList from "~/components/tabs-list";
import Typography from "~/components/typography";
import { use_handle_dynamic_state } from "~/hooks/use-handle-dynamic-state";
import { use_media_query } from "~/hooks/use-media-query";
import { use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import {
  is_auxiliary_content_visible_atom,
  story_metadata_atom
} from "../../atoms";
import styles from "./auxiliary-content.module.scss";

const EditorAuxiliaryContentCommentList = dynamic(
  () => import("./comment-list"),
  {
    loading: dynamic_loader()
  }
);
const EditorAuxiliaryContentCommentListDisabledState = dynamic(
  () => import("./comment-list/disabled-state"),
  {
    loading: dynamic_loader()
  }
);
const EditorAuxiliaryContentSuggestionList = dynamic(
  () => import("./suggestion-list"),
  {
    loading: dynamic_loader()
  }
);

export type StoryCommentsSortValue = "most-liked" | "recent";
export type EditorAuxiliaryContentTabValue = "suggested" | "comments";

// Header tabs

const HeaderTabs = ({
  value,
  on_change
}: {
  on_change: (next_value: EditorAuxiliaryContentTabValue) => void;
  value: EditorAuxiliaryContentTabValue;
}): React.ReactElement => (
  <Tabs
    onValueChange={(next_value): void =>
      on_change(next_value as EditorAuxiliaryContentTabValue)
    }
    value={value}
  >
    <TabsList className={clsx(css["full-w"], styles.x, styles["tabs-list"])}>
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
  const story = use_atom_value(story_metadata_atom);
  const blog = use_blog_context();
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));
  const comment_count =
    use_app_selector(
      (state) => state.entities.story_comment_counts[story.id]
    ) || 0;
  const [value, set_value] = React.useState<EditorAuxiliaryContentTabValue>(
    is_smaller_than_desktop ? "suggested" : "comments"
  );
  const [sort, set_sort] = React.useState<StoryCommentsSortValue>("most-liked");
  use_handle_dynamic_state<typeof sort>("most-liked", set_sort);

  const handle_sort_change = React.useCallback(
    (next_sort: StoryCommentsSortValue) => {
      set_sort(next_sort);
    },
    []
  );

  React.useEffect(() => {
    if (!is_smaller_than_desktop) {
      set_value("comments");
    }
  }, [is_smaller_than_desktop]);

  return (
    <NoSsr>
      <header
        className={clsx(
          css["flex-col"],
          styles.header,
          blog?.is_story_minimal_layout && styles["minimal-layout"]
        )}
      >
        {is_smaller_than_desktop && (
          <HeaderTabs on_change={set_value} value={value} />
        )}
        {value === "comments" && (
          <div className={clsx(css["full-h"], css["flex-center"])}>
            <Typography
              className={clsx(css["f-grow"], styles.x, styles["header-label"])}
              level={"body2"}
              weight={"bold"}
            >
              {story.disable_comments ? "No" : abbreviate_number(comment_count)}{" "}
              {comment_count === 1 ? "comment" : "comments"}
            </Typography>
            <Divider orientation={"vertical"} />
            <Select
              disabled={story.disable_comments}
              onValueChange={(next_value): void =>
                handle_sort_change(next_value as StoryCommentsSortValue)
              }
              slot_props={{
                trigger: {
                  "aria-label": "Sort comments",
                  className: clsx(
                    css["focus-invert"],
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
              <Option value={"most-liked"}>Relevant</Option>
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
          set_sort={handle_sort_change}
          sort={sort}
        />
      )}
    </NoSsr>
  );
};

const EditorAuxiliaryContent = (): React.ReactElement => {
  const set_is_auxiliary_content_visible = use_set_atom(
    is_auxiliary_content_visible_atom
  );
  const [ref, { entry }] = use_intersection_observer({
    rootMargin: "-52px 0px 0px 0px"
  });

  React.useEffect(() => {
    set_is_auxiliary_content_visible(Boolean(entry && entry.isIntersecting));
  }, [entry, set_is_auxiliary_content_visible]);

  return (
    <React.Fragment>
      <section
        className={clsx(css["flex-col"], styles["auxiliary-content"])}
        id={"auxiliary-content"}
        ref={ref}
      >
        <Content />
      </section>
    </React.Fragment>
  );
};

export default EditorAuxiliaryContent;
