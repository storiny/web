"use client";

import SuspenseLoader from "@storiny/web/src/common/suspense-loader";
import clsx from "clsx";
import { Provider, useSetAtom as use_set_atom } from "jotai";
import dynamic from "next/dynamic";
import React from "react";
import Button from "src/components/button";
import Grow from "src/components/grow";
import IconButton from "src/components/icon-button";
import Input from "src/components/input";
import Popover, { Close } from "src/components/popover";
import Spacer from "src/components/spacer";
import Typography from "src/components/typography";

import CloudOffIcon from "~/icons/CloudOff";
import HandClickIcon from "~/icons/HandClick";
import SearchIcon from "~/icons/Search";
import XIcon from "~/icons/X";

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
      className={clsx("full-w", "flex-center")}
      style={{ minHeight: "292px" }}
    >
      {error && !is_loading ? (
        <div
          className={clsx("flex-col", "flex-center")}
          style={{ "--icon-size": "36px" } as React.CSSProperties}
        >
          <CloudOffIcon />
          <Spacer orientation={"vertical"} />
          <Typography className={"t-minor"} level={"body3"}>
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
        container: { className: "f-grow" }
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
        <div className={clsx("flex-center", styles.header)}>
          <span className={clsx("flex-center", styles.icon)}>
            <HoveredSymbol />
          </span>
          <Typography className={"t-bold"} level={"body2"}>
            Pick a symbol
          </Typography>
          <Grow />
          <div className={clsx("flex-center", styles.close)}>
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
        <div className={clsx("flex-center", styles.footer)}>
          <SearchInput />
        </div>
      </Provider>
    </Popover>
  );
};

export default SymbolPicker;
