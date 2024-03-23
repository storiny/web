"use client";

import clsx from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";
import {
  GroupedVirtuoso,
  GroupedVirtuosoHandle,
  GroupedVirtuosoProps
} from "react-virtuoso";

import { Root, Scrollbar, Thumb, Viewport } from "~/components/scroll-area";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { TSymbol } from "~/entities/symbol-picker";
import { symbol_query_atom } from "~/entities/symbol-picker/core/atoms";
import css from "~/theme/main.module.scss";

import { LIST_HEIGHT, SYMBOLS_PER_ROW } from "../../constants";
import { default as data } from "../../data.json";
import { use_symbol_search } from "../../hooks";
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
const get_visible_symbols = (
  index: number,
  list: TSymbol[]
): Array<TSymbol> => {
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
 * @param group_index Category index
 */
const get_symbol_row = (index: number, group_index: number): Array<TSymbol> => {
  const curr_index = GROUP_COUNTS.slice(0, group_index || 1).reduce(
    (a, b) => a + b,
    0
  );
  const relative_group_index = group_index === 0 ? index : index - curr_index;
  const group_symbols = GROUPS[group_index].items;

  return get_visible_symbols(relative_group_index, group_symbols);
};

// Scroller

const Scroller = React.memo(
  React.forwardRef<HTMLDivElement, React.ComponentPropsWithRef<"div">>(
    ({ children, className, ...rest }, ref) => {
      const query = use_atom_value(symbol_query_atom);
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
    className={styles["group-title"]}
    color={"minor"}
    level={"body2"}
    weight={"medium"}
  >
    {GROUPS[index].title}
  </Typography>
));

GroupHeader.displayName = "GroupHeader";

// Symbol row

const SymbolRow = React.memo<
  {
    group_index: number;
    index: number;
    symbols?: TSymbol[];
  } & React.ComponentPropsWithoutRef<"div">
>(({ index, group_index, symbols: symbols_prop, className, ...rest }) => {
  let symbols;

  if (symbols_prop) {
    symbols = get_visible_symbols(index, symbols_prop);
  } else {
    symbols = get_symbol_row(index, group_index);
  }

  return (
    <div
      {...rest}
      className={clsx(css["flex"], styles["symbol-row"], className)}
    >
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
    <div aria-hidden className={clsx(css["flex"], styles["symbol-row"])}>
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
  const query = use_atom_value(symbol_query_atom);
  const search_results = use_symbol_search();
  const has_search_results = Boolean(search_results.length);

  return (
    <Root className={clsx(css["flex-center"], styles.list)} type={"auto"}>
      {Boolean(query) && !has_search_results ? (
        <div
          className={clsx(css["flex-col"], styles.empty)}
          style={{ height: LIST_HEIGHT }}
        >
          <Typography level={"body2"} weight={"medium"}>
            Could not find any symbol for &quot;
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
              ? [Math.ceil(search_results.length / SYMBOLS_PER_ROW)]
              : GROUP_COUNTS
          }
          itemContent={(index, group_index): React.ReactElement => (
            <SymbolRow
              group_index={group_index}
              index={index}
              key={`${index}:${group_index}`}
              symbols={has_search_results ? search_results : undefined}
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
