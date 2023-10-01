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

import { emoji_query_atom } from "./core/atoms";
import SkinTone from "./core/components/skin-tone";
import styles from "./emoji-picker.module.scss";
import { EmojiPickerProps } from "./emoji-picker.props";
import { EmojiPickerContext } from "./emoji-picker-context";

const HoveredEmoji = dynamic(() => import("./core/components/emoji/hovered"), {
  loading: () => <HandClickIcon />
});
const Main = dynamic(() => import("./core/components/main"), {
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
  const set_query = use_set_atom(emoji_query_atom);
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

const EmojiPicker = (props: EmojiPickerProps): React.ReactElement => {
  const { on_emoji_select, popover_props, children } = props;
  const [open, set_open] = React.useState<boolean>(false);

  /**
   * Close popover when selecting an emoji
   */
  const on_emoji_select_impl = React.useCallback(
    (emoji: string) => {
      set_open(false);
      on_emoji_select?.(emoji);
    },
    [on_emoji_select]
  );

  return (
    <Popover
      slot_props={{
        trigger: { "aria-label": "Pick an emoji" }
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
            <HoveredEmoji />
          </span>
          <Typography className={css["t-bold"]} level={"body2"}>
            Pick an emoji
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
        <EmojiPickerContext.Provider
          value={{ on_emoji_select: on_emoji_select_impl }}
        >
          <Main />
        </EmojiPickerContext.Provider>
        <div className={clsx(css["flex-center"], styles.footer)}>
          <SearchInput />
          <SkinTone />
        </div>
      </Provider>
    </Popover>
  );
};

export default EmojiPicker;
