"use client";

import clsx from "clsx";
import {
  useAtomValue as use_atom_value,
  useSetAtom as use_set_atom
} from "jotai";
import React from "react";
import {
  GroupedVirtuoso,
  GroupedVirtuosoHandle,
  GroupedVirtuosoProps
} from "react-virtuoso";

import { Root, Scrollbar, Thumb, Viewport } from "~/components/scroll-area";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";
import { capitalize } from "~/utils/capitalize";

import { emoji_category_atom, emoji_query_atom } from "../../atoms";
import { EmojiCategory, EMOJIS_PER_ROW, LIST_HEIGHT } from "../../constants";
import { default as data } from "../../data.json";
import { use_emoji_search } from "../../hooks";
import { Emoji, PlaceholderEmoji } from "../emoji";
import styles from "./list.module.scss";

const GROUPS = data.categories;
const GROUP_COUNTS = GROUPS.map((group) =>
  Math.ceil(group.emojis.length / EMOJIS_PER_ROW)
);
const EMOJI_MAP = data.emojis;
const CATEGORY_INDEX_ID_MAP: Record<string, EmojiCategory> = {
  "0": EmojiCategory.SMILEYS_AND_PEOPLE,
  "1": EmojiCategory.ANIMALS_AND_NATURE,
  "2": EmojiCategory.FOOD_AND_DRINK,
  "3": EmojiCategory.ACTIVITY,
  "4": EmojiCategory.TRAVEL_AND_PLACES,
  "5": EmojiCategory.OBJECTS,
  "6": EmojiCategory.SYMBOLS,
  "7": EmojiCategory.FLAGS
};

/**
 * Returns sliced chunk of emoji array for a specific row
 * @param index Row index
 * @param list Emoji list
 */
const get_visible_emojis = (
  index: number,
  list: string[]
): Array<keyof typeof EMOJI_MAP> => {
  const emoji_ids = list.slice(
    index * EMOJIS_PER_ROW,
    index * EMOJIS_PER_ROW + EMOJIS_PER_ROW
  ) as Array<keyof typeof EMOJI_MAP>;

  // Add fake emojis to fill the row
  if (emoji_ids.length < EMOJIS_PER_ROW) {
    emoji_ids.push(...new Array(EMOJIS_PER_ROW - emoji_ids.length));
  }

  return emoji_ids;
};

/**
 * Returns emojis to render in a row
 * @param index Emoji index
 * @param group_index Category index
 */
const get_emoji_row = (
  index: number,
  group_index: number
): Array<keyof typeof EMOJI_MAP> => {
  const curr_index = GROUP_COUNTS.slice(0, group_index || 1).reduce(
    (a, b) => a + b,
    0
  );
  const relative_group_index = group_index === 0 ? index : index - curr_index;
  const group_emojis = GROUPS[group_index].emojis;

  return get_visible_emojis(relative_group_index, group_emojis);
};

// Scroller

const Scroller = React.memo(
  React.forwardRef<HTMLDivElement, React.ComponentPropsWithRef<"div">>(
    ({ children, className, ...rest }, ref) => {
      const query = use_atom_value(emoji_query_atom);
      return (
        <>
          <Viewport
            {...rest}
            className={clsx(styles.viewport, className)}
            ref={ref}
          >
            <div className={styles["list-wrapper"]}>{children}</div>
          </Viewport>
          <Scrollbar
            // Update scrollbar height on query change
            key={query}
            orientation="vertical"
          >
            <Thumb />
          </Scrollbar>
        </>
      );
    }
  )
);

Scroller.displayName = "Scroller";

// Footer

const Footer = React.memo(
  () => <Spacer orientation={"vertical"} size={2} />,
  () => true
);

Footer.displayName = "Footer";

// Top item list

const TopItemList = React.memo(
  ({ children }: { children?: React.ReactNode }) => (
    <React.Fragment>{children}</React.Fragment>
  ),
  (prev_props, next_props) => prev_props.children === next_props.children
);

TopItemList.displayName = "TopItemList";

// Group

const Group = React.memo(
  React.forwardRef<HTMLDivElement, React.ComponentPropsWithRef<"div">>(
    ({ children, className, ...rest }, ref) => (
      <div
        {...rest}
        className={clsx(styles["group-header"], className)}
        ref={ref}
      >
        {children}
      </div>
    )
  )
);

Group.displayName = "Group";

// Group header

const GroupHeader = React.memo<{ index: number }>(({ index }) => (
  <Typography
    className={clsx(css["t-medium"], css["t-minor"], styles["group-title"])}
    level={"body2"}
  >
    {capitalize(GROUPS[index].id.replace(/-/g, " "))}
  </Typography>
));

GroupHeader.displayName = "GroupHeader";

// Emoji row

const EmojiRow = React.memo<
  {
    emoji_ids?: string[];
    group_index: number;
    index: number;
  } & React.ComponentPropsWithoutRef<"div">
>(({ index, group_index, emoji_ids: emoji_ids_prop, className, ...rest }) => {
  let emoji_ids;

  if (emoji_ids_prop) {
    emoji_ids = get_visible_emojis(index, emoji_ids_prop);
  } else {
    emoji_ids = get_emoji_row(index, group_index);
  }

  return (
    <div
      {...rest}
      className={clsx(css["flex"], styles["emoji-row"], className)}
    >
      {emoji_ids.map(
        (emoji_id, index): React.ReactElement => (
          <Emoji emoji_id={emoji_id} key={emoji_id || index} />
        )
      )}
    </div>
  );
});

EmojiRow.displayName = "EmojiRow";

// Scroll seek placeholder

const ScrollSeekPlaceholder = React.memo(
  () => (
    <div aria-hidden className={clsx(css["flex"], styles["emoji-row"])}>
      {[...Array(EMOJIS_PER_ROW)].map((_, index) => (
        <PlaceholderEmoji key={index} />
      ))}
    </div>
  ),
  () => true
);

ScrollSeekPlaceholder.displayName = "ScrollSeekPlaceholder";

// Main component

const EmojiList = React.forwardRef<
  GroupedVirtuosoHandle,
  GroupedVirtuosoProps<any, any>
>((props, ref) => {
  const { className, ...rest } = props;
  const set_category = use_set_atom(emoji_category_atom);
  const query = use_atom_value(emoji_query_atom);
  const search_results = use_emoji_search();
  const has_search_results = Boolean(search_results.length);

  const handle_category_change = React.useCallback(
    (index?: number): void => {
      const next_category = CATEGORY_INDEX_ID_MAP[String(index)];
      if (next_category) {
        set_category(next_category);
      }
    },
    [set_category]
  );

  return (
    <Root
      className={clsx(css["flex-center"], styles.list)}
      style={
        {
          "--spritesheet": `url("${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/raw/spritesheets/emoji-sprite.png")`
        } as React.CSSProperties
      }
      type={"auto"}
    >
      {Boolean(query) && !has_search_results ? (
        <div
          className={clsx(css["flex-col"], styles.empty)}
          style={{ height: LIST_HEIGHT }}
        >
          <Typography className={css["t-medium"]} level={"body2"}>
            Could not find any emoji for &quot;
            <span style={{ wordBreak: "break-all" }}>{query}</span>&quot;
          </Typography>
        </div>
      ) : (
        <GroupedVirtuoso
          {...rest}
          className={clsx(css["f-grow"], className)}
          components={{
            Group,
            Scroller,
            TopItemList,
            Footer,
            ScrollSeekPlaceholder
          }}
          groupContent={(index): React.ReactElement =>
            has_search_results ? (
              <Spacer key={index} orientation={"vertical"} size={1.5} />
            ) : (
              <GroupHeader index={index} key={index} />
            )
          }
          groupCounts={
            has_search_results
              ? [Math.ceil(search_results.length / EMOJIS_PER_ROW)]
              : GROUP_COUNTS
          }
          itemContent={(index, group_index): React.ReactElement => (
            <EmojiRow
              emoji_ids={has_search_results ? search_results : undefined}
              group_index={group_index}
              index={index}
              key={`${index}:${group_index}`}
            />
          )}
          itemsRendered={(items): void =>
            has_search_results
              ? undefined
              : handle_category_change(
                  Math.min(
                    ...items
                      .map((item) => (item as any).groupIndex)
                      .filter((item) => typeof item === "number")
                  )
                )
          }
          ref={ref}
          scrollSeekConfiguration={{
            enter: (velocity): boolean => Math.abs(velocity) > 950,
            exit: (velocity): boolean => Math.abs(velocity) < 10
          }}
          style={
            {
              height: LIST_HEIGHT,
              "--sheet-cols": data.sheet.cols,
              "--sheet-rows": data.sheet.rows,
              "--sprite-size": `${100 * data.sheet.cols}% ${
                100 * data.sheet.rows
              }%`
            } as React.CSSProperties
          }
        />
      )}
    </Root>
  );
});

EmojiList.displayName = "EmojiList";

export default EmojiList;
