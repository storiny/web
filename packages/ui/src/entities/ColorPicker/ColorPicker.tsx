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
import dynamic from "next/dynamic";
import React from "react";

import Grow from "~/components/Grow";
import IconButton from "~/components/IconButton";
import Typography from "~/components/Typography";
import XIcon from "~/icons/X";

import styles from "./ColorPicker.module.scss";
import { ColorPickerProps } from "./ColorPicker.props";

const ColorPickerCore = dynamic(() => import("./core/components/ColorPicker"), {
  loading: () => (
    <div className={"flex-center"} style={{ minHeight: "300px" }}>
      <SuspenseLoader />
    </div>
  )
});

const ColorPicker = (props: ColorPickerProps): React.ReactElement => {
  const { children, ...rest } = props;
  return (
    <Root>
      <Trigger aria-label="Pick a color" asChild>
        {children}
      </Trigger>
      <Portal>
        <Content className={styles.content} collisionPadding={8} sideOffset={5}>
          <div className={clsx("flex-center", styles.header)}>
            <Typography className={"t-bold"} level={"body2"}>
              Pick a color
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
          <ColorPickerCore {...rest} />
          <Arrow className={styles.arrow} />
        </Content>
      </Portal>
    </Root>
  );
};

export default ColorPicker;
