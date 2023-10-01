"use client";

import SuspenseLoader from "@storiny/web/src/common/suspense-loader";
import clsx from "clsx";
import { Provider, useSetAtom as use_set_atom } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import IconButton from "~/components/icon-button";
import Input from "~/components/input";
import Popover, { Close } from "~/components/popover";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import CloudOffIcon from "~/icons/cloud-off";
import HandClickIcon from "~/icons/hand-click";
import SearchIcon from "~/icons/search";
import XIcon from "~/icons/x";
import css from "~/theme/main.module.scss";

import { symbol_query_atom } from "./core/atoms";
import styles from "./symbol-picker.module.scss";
import { SymbolPickerProps } from "./symbol-picker.props";
import { SymbolPickerContext } from "./symbol-picker-context";

const HoveredSymbol = dynamic(
  () => import("./core/components/symbol/hovered"),
  {
    loading: () => <HandClickIcon />
  }
);
const List = dynamic(() => import("./core/components/list"), {
  loading: ({ error, isLoading: is_loading, retry }) => (
    <div
      className={clsx(css["full-w"], css["flex-center"])}
      style={{ minHeight: "292px" }}
    >
      {error && !is_loading ? (
        <div
          className={clsx(css["flex-col"], css["flex-center"])}
          style={{ "--icon-size": "36px" } as React.CSSProperties}
        >
          <CloudOffIcon />
          <Spacer orientation={"vertical"} />
          <Typography className={css["t-minor"]} level={"body3"}>
            Network error
          </Typography>
          <Spacer orientation={"vertical"} size={2} />
          <Button onClick={retry} size={"sm"}>
            Retry
          </Button>
        </div>
      ) : (
        <SuspenseLoader />
      )}
    </div>
  )
});

// Search input

const SearchInput = (): React.ReactElement => {
  const set_query = use_set_atom(symbol_query_atom);
  return (
    <Input
      autoFocus
      decorator={<SearchIcon />}
      defaultValue={""}
      onChange={(event): void => set_query(event.target.value)}
      placeholder={"Search"}
      slot_props={{
        container: { className: css["f-grow"] }
      }}
      type={"search"}
    />
  );
};

const SymbolPicker = (props: SymbolPickerProps): React.ReactElement => {
  const { on_symbol_select, popover_props, children } = props;
  const [open, set_open] = React.useState<boolean>(false);

  /**
   * Close popover when selecting a symbol
   */
  const on_symbol_select_impl = React.useCallback(
    (symbol: string) => {
      set_open(false);
      on_symbol_select?.(symbol);
    },
    [on_symbol_select]
  );

  return (
    <Popover
      slot_props={{
        trigger: { "aria-label": "Pick a symbol" }
      }}
      {...popover_props}
      className={clsx(styles.popover, popover_props?.className)}
      onOpenChange={set_open}
      open={open}
      trigger={children}
    >
      <Provider>
        <div className={clsx(css["flex-center"], styles.header)}>
          <span className={clsx(css["flex-center"], styles.icon)}>
            <HoveredSymbol />
          </span>
          <Typography className={css["t-bold"]} level={"body2"}>
            Pick a symbol
          </Typography>
          <Grow />
          <div className={clsx(css["flex-center"], styles.close)}>
            <Close aria-label={"Close"} asChild title={"Close"}>
              <IconButton variant={"ghost"}>
                <XIcon />
              </IconButton>
            </Close>
          </div>
        </div>
        <SymbolPickerContext.Provider
          value={{ on_symbol_select: on_symbol_select_impl }}
        >
          <List />
        </SymbolPickerContext.Provider>
        <div className={clsx(css["flex-center"], styles.footer)}>
          <SearchInput />
        </div>
      </Provider>
    </Popover>
  );
};

export default SymbolPicker;
