"use client";

import {
  Arrow,
  Close,
  Content,
  Portal,
  Root,
  Trigger
} from "@radix-ui/react-popover";
import SuspenseLoader from "@storiny/web/src/common/suspense-loader";
import clsx from "clsx";
import { Provider, useSetAtom } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import Grow from "~/components/Grow";
import IconButton from "~/components/IconButton";
import Input from "~/components/Input";
import Typography from "~/components/Typography";
import { queryAtom } from "~/entities/EmojiPicker/core/atoms";
import HandClickIcon from "~/icons/HandClick";
import SearchIcon from "~/icons/Search";
import XIcon from "~/icons/X";

import SkinTone from "./core/components/SkinTone";
import { Emoji } from "./core/types";
import styles from "./EmojiPicker.module.scss";
import { EmojiPickerProps } from "./EmojiPicker.props";
import { EmojiPickerContext } from "./EmojiPickerContext";

const HoveredEmoji = dynamic(() => import("./core/components/Emoji/Hovered"), {
  loading: () => <HandClickIcon />
});

const Main = dynamic(() => import("./core/components/Main"), {
  loading: () => (
    <div
      className={clsx("full-w", "flex-center")}
      style={{ minHeight: "292px" }}
    >
      <SuspenseLoader />
    </div>
  )
});

// Search input

const SearchInput = (): React.ReactElement => {
  const setQuery = useSetAtom(queryAtom);
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

const EmojiPicker = (props: EmojiPickerProps): React.ReactElement => {
  const { onEmojiSelect, children } = props;
  const [open, setOpen] = React.useState<boolean>(false);

  /**
   * Close popover when selecting an emoji
   */
  const onEmojiSelectImpl = React.useCallback(
    (emoji: Emoji) => {
      setOpen(false);
      onEmojiSelect?.(emoji);
    },
    [onEmojiSelect]
  );

  return (
    <Root onOpenChange={setOpen} open={open}>
      <Trigger aria-label="Pick an emoji" asChild>
        {children}
      </Trigger>
      <Portal>
        <Content className={styles.content} collisionPadding={8} sideOffset={5}>
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
          <Arrow className={styles.arrow} />
        </Content>
      </Portal>
    </Root>
  );
};

export default EmojiPicker;
