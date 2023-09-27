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

import { emojiQueryAtom } from "./core/atoms";
import SkinTone from "./core/components/SkinTone";
import styles from "./EmojiPicker.module.scss";
import { EmojiPickerProps } from "./EmojiPicker.props";
import { EmojiPickerContext } from "./EmojiPickerContext";

const HoveredEmoji = dynamic(() => import("./core/components/Emoji/Hovered"), {
  loading: () => <HandClickIcon />
});

const Main = dynamic(() => import("./core/components/Main"), {
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
  const setQuery = useSetAtom(emojiQueryAtom);
  return (
    <Input
      autoFocus
      decorator={<SearchIcon />}
      defaultValue={""}
      onChange={(event): void => setQuery(event.target.value)}
      placeholder={"Search"}
      slot_props={{
        container: { className: "f-grow" }
      }}
      type={"search"}
    />
  );
};

const EmojiPicker = (props: EmojiPickerProps): React.ReactElement => {
  const { onEmojiSelect, popoverProps, children } = props;
  const [open, setOpen] = React.useState<boolean>(false);

  /**
   * Close popover when selecting an emoji
   */
  const onEmojiSelectImpl = React.useCallback(
    (emoji: string) => {
      setOpen(false);
      onEmojiSelect?.(emoji);
    },
    [onEmojiSelect]
  );

  return (
    <Popover
      slot_props={{
        trigger: { "aria-label": "Pick an emoji" }
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
            <HoveredEmoji />
          </span>
          <Typography className={"t-bold"} level={"body2"}>
            Pick an emoji
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
        <EmojiPickerContext.Provider
          value={{ onEmojiSelect: onEmojiSelectImpl }}
        >
          <Main />
        </EmojiPickerContext.Provider>
        <div className={clsx("flex-center", styles.footer)}>
          <SearchInput />
          <SkinTone />
        </div>
      </Provider>
    </Popover>
  );
};

export default EmojiPicker;
