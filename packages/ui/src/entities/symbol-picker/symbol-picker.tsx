"use client";

import SuspenseLoader from "@storiny/web/src/common/suspense-loader";
import clsx from "clsx";
import { Provider, useSetAtom } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import Button from "~/components/Button";
import Grow from "~/components/Grow";
import IconButton from "~/components/IconButton";
import Input from "~/components/Input";
import Popover, { Close } from "~/components/Popover";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import CloudOffIcon from "~/icons/CloudOff";
import HandClickIcon from "~/icons/HandClick";
import SearchIcon from "~/icons/Search";
import XIcon from "~/icons/X";

import { symbolQueryAtom } from "./core/atoms";
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
  loading: ({ error, isLoading, retry }) => (
    <div
      className={clsx("full-w", "flex-center")}
      style={{ minHeight: "292px" }}
    >
      {error && !isLoading ? (
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
  const setQuery = useSetAtom(symbolQueryAtom);
  return (
    <Input
      autoFocus
      decorator={<SearchIcon />}
      defaultValue={""}
      onChange={(event): void => setQuery(event.target.value)}
      placeholder={"Search"}
      slotProps={{
        container: { className: "f-grow" }
      }}
      type={"search"}
    />
  );
};

const SymbolPicker = (props: SymbolPickerProps): React.ReactElement => {
  const { onSymbolSelect, popoverProps, children } = props;
  const [open, setOpen] = React.useState<boolean>(false);

  /**
   * Close popover when selecting a symbol
   */
  const onSymbolSelectImpl = React.useCallback(
    (symbol: string) => {
      setOpen(false);
      onSymbolSelect?.(symbol);
    },
    [onSymbolSelect]
  );

  return (
    <Popover
      slotProps={{
        trigger: { "aria-label": "Pick a symbol" }
      }}
      {...popoverProps}
      className={clsx(styles.popover, popoverProps?.className)}
      onOpenChange={setOpen}
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
          value={{ onSymbolSelect: onSymbolSelectImpl }}
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
