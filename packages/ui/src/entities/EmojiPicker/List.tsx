import clsx from "clsx";
import React from "react";
import { GroupedVirtuoso, GroupedVirtuosoHandle } from "react-virtuoso";

import ScrollArea from "~/components/ScrollArea";

import data from "./data.json";

const EMOJIS_PER_ROW = 7;

const Scroller = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithRef<"div">
>(({ children, ...rest }, ref) => (
  <ScrollArea
    className={clsx("flex", "f-grow")}
    slotProps={{
      viewport: {
        ref,
        ...rest
      }
    }}
    type={"auto"}
  >
    {children}
  </ScrollArea>
));

Scroller.displayName = "Scroller";

const EmojiList = (): React.ReactElement => {
  const virtuoso = React.useRef<GroupedVirtuosoHandle>(null);
  const groups = data.categories;
  const groupCounts = groups.map((group) =>
    Math.ceil(group.emojis.length / EMOJIS_PER_ROW)
  );
  const emojiMap = data.emojis;

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%"
      }}
    >
      <GroupedVirtuoso
        className={"full-w"}
        components={{ Scroller }}
        groupContent={(index): React.ReactElement => (
          <div
            style={{
              border: "1px solid var(--divider)",
              padding: "4px 8px"
            }}
          >
            {groups[index].id}
          </div>
        )}
        groupCounts={groupCounts}
        itemContent={(index, groupIndex): React.ReactElement => {
          const currInx = groupCounts
            .slice(0, groupIndex || 1)
            .reduce((a, b) => a + b, 0);
          const relIdx = groupIndex === 0 ? index : index - currInx;

          const emojiIds = groups[groupIndex].emojis;
          const start = relIdx * EMOJIS_PER_ROW;
          const end = start + EMOJIS_PER_ROW;
          const emoji_ = emojiIds.slice(start, end);

          if (emoji_.length < EMOJIS_PER_ROW) {
            emoji_.push(...new Array(EMOJIS_PER_ROW - emoji_.length));
          }

          return (
            <div
              style={{
                display: "flex",
                gap: "12px",
                //   paddingBlock: "12px",
                justifyContent: "space-between"
              }}
            >
              {emoji_.map((emojiId): React.ReactElement => {
                const emoji = emojiMap[emojiId as keyof typeof emojiMap];

                if (!emoji) {
                  return (
                    <span
                      key={emojiId}
                      style={{
                        width: "24px",
                        height: "24px"
                      }}
                    />
                  );
                }

                // const emojiSkin = emoji.skins[skin - 1] || emoji.skins[0];
                // console.log(emoji);
                const emojiSkin = emoji.skins[0];
                const spritesheetSrc =
                  "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@14.0.0/img/apple/sheets-256/64.png";
                const size = 24;

                return (
                  <span
                    key={emojiId}
                    style={{
                      display: "block",
                      width: `${size}px`,
                      height: `${size}px`,
                      minHeight: `${size}px`,
                      minWidth: `${size}px`,
                      backgroundImage: `url(${spritesheetSrc})`,
                      backgroundSize: `${100 * data.sheet.cols}% ${
                        100 * data.sheet.rows
                      }%`,
                      backgroundPosition: `${
                        (100 / (data.sheet.cols - 1)) * emojiSkin.x
                      }% ${(100 / (data.sheet.rows - 1)) * emojiSkin.y}%`
                    }}
                  />
                );
              })}
            </div>
          );
        }}
        ref={virtuoso}
        style={{ height: 300 }}
      />
    </div>
  );
};

export default EmojiList;
