"use client";

import {
  Arrow,
  Close,
  Content,
  Portal,
  Root,
  Trigger
} from "@radix-ui/react-popover";
import clsx from "clsx";
import React from "react";

import Grow from "~/components/Grow";
import IconButton from "~/components/IconButton";
import Input from "~/components/Input";
import ScrollArea from "~/components/ScrollArea";
import Typography from "~/components/Typography";
import HandClickIcon from "~/icons/HandClick";
import SearchIcon from "~/icons/Search";
import XIcon from "~/icons/X";

import styles from "./EmojiPicker.module.scss";
import { EmojiPickerProps } from "./EmojiPicker.props";
import EmojiList from "./List";
import SkinTone from "./SkinTone";
import EmojiPickerTabs from "./Tabs";

const EmojiPicker = (props: EmojiPickerProps): React.ReactElement => {
  const { children } = props;
  return (
    <Root open>
      <Trigger aria-label="Pick an emoji" asChild>
        {children}
      </Trigger>
      <Portal>
        <Content className={styles.content} collisionPadding={8} sideOffset={5}>
          <div className={clsx("flex-center", styles.header)}>
            <span className={clsx("flex-center", styles.icon)}>
              <HandClickIcon />
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
          <div className={clsx("flex", styles.main)}>
            <EmojiPickerTabs />
            <EmojiList />
          </div>
          <div className={clsx("flex-center", styles.footer)}>
            <Input
              decorator={<SearchIcon />}
              placeholder={"Search"}
              slotProps={{
                container: { className: "f-grow" }
              }}
              type={"search"}
            />
            <SkinTone />
          </div>
          <Arrow className={styles.arrow} />
        </Content>
      </Portal>
    </Root>
  );
};

export default EmojiPicker;
