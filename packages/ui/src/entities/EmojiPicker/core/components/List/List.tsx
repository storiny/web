"use client";

import clsx from "clsx";
import { useAtomValue, useSetAtom } from "jotai";
import React from "react";
import {
  GroupedVirtuoso,
  GroupedVirtuosoHandle,
  GroupedVirtuosoProps
} from "react-virtuoso";

import { Root, Scrollbar, Thumb, Viewport } from "~/components/ScrollArea";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import { capitalize } from "~/utils/capitalize";

import { emojiCategoryAtom, queryAtom } from "../../atoms";
import { EmojiCategory, EMOJIS_PER_ROW, LIST_HEIGHT } from "../../constants";
import data from "../../data.json";
import { useSearch } from "../../hooks";
import { Emoji, PlaceholderEmoji } from "../Emoji";
import styles from "./List.module.scss";

const GROUPS = data.categories;
const GROUP_COUNTS = GROUPS.map((group) =>
  Math.ceil(group.emojis.length / EMOJIS_PER_ROW)
);
const EMOJI_MAP = data.emojis;

const categoryIndexToIdMap: Record<string, EmojiCategory> = {
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
const getVisibleEmojis = (
  index: number,
  list: string[]
): Array<keyof typeof EMOJI_MAP> => {
  const emojiIds = list.slice(
    index * EMOJIS_PER_ROW,
    index * EMOJIS_PER_ROW + EMOJIS_PER_ROW
  ) as Array<keyof typeof EMOJI_MAP>;

  // Add fake emojis to fill the row
  if (emojiIds.length < EMOJIS_PER_ROW) {
    emojiIds.push(...new Array(EMOJIS_PER_ROW - emojiIds.length));
  }

  return emojiIds;
};

/**
 * Returns emojis to render in a row
 * @param index Emoji index
 * @param groupIndex Category index
 */
const getEmojiRow = (
  index: number,
  groupIndex: number
): Array<keyof typeof EMOJI_MAP> => {
  const currentIndex = GROUP_COUNTS.slice(0, groupIndex || 1).reduce(
    (a, b) => a + b,
    0
  );
  const relativeGroupIndex = groupIndex === 0 ? index : index - currentIndex;
  const groupEmojis = GROUPS[groupIndex].emojis;

  return getVisibleEmojis(relativeGroupIndex, groupEmojis);
};

// Scroller

const Scroller = React.memo(
  React.forwardRef<HTMLDivElement, React.ComponentPropsWithRef<"div">>(
    ({ children, className, ...rest }, ref) => {
      const query = useAtomValue(queryAtom);
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
  (prevProps, nextProps) => prevProps.children === nextProps.children
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
    className={clsx("t-medium", "t-minor", styles["group-title"])}
    level={"body2"}
  >
    {capitalize(GROUPS[index].id.replace(/-/g, " "))}
  </Typography>
));

GroupHeader.displayName = "GroupHeader";

// Emoji row

const EmojiRow = React.memo<
  {
    emojiIds?: string[];
    groupIndex: number;
    index: number;
  } & React.ComponentPropsWithoutRef<"div">
>(({ index, groupIndex, emojiIds: emojiIdsProp, className, ...rest }) => {
  let emojiIds;

  if (emojiIdsProp) {
    emojiIds = getVisibleEmojis(index, emojiIdsProp);
  } else {
    emojiIds = getEmojiRow(index, groupIndex);
  }

  return (
    <div {...rest} className={clsx("flex", styles["emoji-row"], className)}>
      {emojiIds.map(
        (emojiId): React.ReactElement => (
          <Emoji emojiId={emojiId} key={emojiId} />
        )
      )}
    </div>
  );
});

EmojiRow.displayName = "EmojiRow";

// Scroll seek placeholder

const ScrollSeekPlaceholder = React.memo(
  () => (
    <div aria-hidden className={clsx("flex", styles["emoji-row"])}>
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
  const setCategory = useSetAtom(emojiCategoryAtom);
  const query = useAtomValue(queryAtom);
  const searchResults = useSearch();
  const hasSearchResults = Boolean(searchResults.length);

  const handleCategoryChange = React.useCallback(
    (index?: number): void => {
      const newCategory = categoryIndexToIdMap[String(index)];
      if (newCategory) {
        setCategory(newCategory);
      }
    },
    [setCategory]
  );

  return (
    <Root className={clsx("flex-center", styles.list)} type={"auto"}>
      {Boolean(query) && !hasSearchResults ? (
        <div className={clsx("flex-col", styles.empty)}>
          <Typography className={"t-medium"} level={"body2"}>
            Could not find any emoji for &quot;
            <span style={{ wordBreak: "break-all" }}>{query}</span>&quot;
          </Typography>
        </div>
      ) : (
        <GroupedVirtuoso
          {...rest}
          className={clsx("f-grow", className)}
          components={{
            Group,
            Scroller,
            TopItemList,
            Footer,
            ScrollSeekPlaceholder
          }}
          groupContent={(index): React.ReactElement =>
            hasSearchResults ? (
              <Spacer key={index} orientation={"vertical"} size={1.5} />
            ) : (
              <GroupHeader index={index} key={index} />
            )
          }
          groupCounts={
            hasSearchResults
              ? [Math.ceil(searchResults.length / EMOJIS_PER_ROW)]
              : GROUP_COUNTS
          }
          itemContent={(index, groupIndex): React.ReactElement => (
            <EmojiRow
              emojiIds={hasSearchResults ? searchResults : undefined}
              groupIndex={groupIndex}
              index={index}
              key={`${index}:${groupIndex}`}
            />
          )}
          itemsRendered={(items): void =>
            hasSearchResults
              ? undefined
              : handleCategoryChange(
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
