"use client";

import clsx from "clsx";
import { useAtomValue } from "jotai";
import React from "react";
import {
  GroupedVirtuoso,
  GroupedVirtuosoHandle,
  GroupedVirtuosoProps
} from "react-virtuoso";

import { Root, Scrollbar, Thumb, Viewport } from "~/components/ScrollArea";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import { TSymbol } from "~/entities/symbol-picker";
import { symbolQueryAtom } from "~/entities/symbol-picker/core/atoms";

import { LIST_HEIGHT, SYMBOLS_PER_ROW } from "../../constants";
import data from "../../data.json";
import { useSymbolSearch } from "../../hooks";
import { PlaceholderSymbol, Symbol } from "../symbol";
import styles from "./list.module.scss";

const GROUPS = data.symbols;
const GROUP_COUNTS = GROUPS.map((group) =>
  Math.ceil(group.items.length / SYMBOLS_PER_ROW)
);

/**
 * Returns sliced chunk of symbol array for a specific row
 * @param index Row index
 * @param list Symbol list
 */
const getVisibleSymbols = (index: number, list: TSymbol[]): Array<TSymbol> => {
  const symbols = list.slice(
    index * SYMBOLS_PER_ROW,
    index * SYMBOLS_PER_ROW + SYMBOLS_PER_ROW
  );

  // Add fake symbols to fill the row
  if (symbols.length < SYMBOLS_PER_ROW) {
    symbols.push(...new Array(SYMBOLS_PER_ROW - symbols.length));
  }

  return symbols;
};

/**
 * Returns symbols to render in a row
 * @param index Symbol index
 * @param groupIndex Category index
 */
const getSymbolRow = (index: number, groupIndex: number): Array<TSymbol> => {
  const currentIndex = GROUP_COUNTS.slice(0, groupIndex || 1).reduce(
    (a, b) => a + b,
    0
  );
  const relativeGroupIndex = groupIndex === 0 ? index : index - currentIndex;
  const groupSymbols = GROUPS[groupIndex].items;

  return getVisibleSymbols(relativeGroupIndex, groupSymbols);
};

// Scroller

const Scroller = React.memo(
  React.forwardRef<HTMLDivElement, React.ComponentPropsWithRef<"div">>(
    ({ children, className, ...rest }, ref) => {
      const query = useAtomValue(symbolQueryAtom);
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
    {GROUPS[index].title}
  </Typography>
));

GroupHeader.displayName = "GroupHeader";

// Symbol row

const SymbolRow = React.memo<
  {
    groupIndex: number;
    index: number;
    symbols?: TSymbol[];
  } & React.ComponentPropsWithoutRef<"div">
>(({ index, groupIndex, symbols: symbolsProp, className, ...rest }) => {
  let symbols;

  if (symbolsProp) {
    symbols = getVisibleSymbols(index, symbolsProp);
  } else {
    symbols = getSymbolRow(index, groupIndex);
  }

  return (
    <div {...rest} className={clsx("flex", styles["symbol-row"], className)}>
      {symbols.map(
        (symbol, index): React.ReactElement => (
          <Symbol key={symbol?.name || index} symbol={symbol} />
        )
      )}
    </div>
  );
});

SymbolRow.displayName = "SymbolRow";

// Scroll seek placeholder

const ScrollSeekPlaceholder = React.memo(
  () => (
    <div aria-hidden className={clsx("flex", styles["symbol-row"])}>
      {[...Array(SYMBOLS_PER_ROW)].map((_, index) => (
        <PlaceholderSymbol key={index} />
      ))}
    </div>
  ),
  () => true
);

ScrollSeekPlaceholder.displayName = "ScrollSeekPlaceholder";

// Main component

const SymbolList = React.forwardRef<
  GroupedVirtuosoHandle,
  GroupedVirtuosoProps<any, any>
>((props, ref) => {
  const { className, ...rest } = props;
  const query = useAtomValue(symbolQueryAtom);
  const searchResults = useSymbolSearch();
  const hasSearchResults = Boolean(searchResults.length);

  return (
    <Root className={clsx("flex-center", styles.list)} type={"auto"}>
      {Boolean(query) && !hasSearchResults ? (
        <div
          className={clsx("flex-col", styles.empty)}
          style={{ height: LIST_HEIGHT }}
        >
          <Typography className={"t-medium"} level={"body2"}>
            Could not find any symbol for &quot;
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
              ? [Math.ceil(searchResults.length / SYMBOLS_PER_ROW)]
              : GROUP_COUNTS
          }
          itemContent={(index, groupIndex): React.ReactElement => (
            <SymbolRow
              groupIndex={groupIndex}
              index={index}
              key={`${index}:${groupIndex}`}
              symbols={hasSearchResults ? searchResults : undefined}
            />
          )}
          ref={ref}
          scrollSeekConfiguration={{
            enter: (velocity): boolean => Math.abs(velocity) > 950,
            exit: (velocity): boolean => Math.abs(velocity) < 10
          }}
          style={{
            height: LIST_HEIGHT
          }}
        />
      )}
    </Root>
  );
});

SymbolList.displayName = "SymbolList";

export default SymbolList;
