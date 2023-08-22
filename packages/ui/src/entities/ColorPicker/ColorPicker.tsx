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
import { Provider } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import Button from "~/components/Button";
import Grow from "~/components/Grow";
import IconButton from "~/components/IconButton";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import { previewColorAtom } from "~/entities/ColorPicker/core/atoms";
import CloudOffIcon from "~/icons/CloudOff";
import XIcon from "~/icons/X";

import styles from "./ColorPicker.module.scss";
import { ColorPickerProps } from "./ColorPicker.props";
import HydrateAtoms from "./core/components/HydrateAtoms";
import Preview from "./core/components/Preview";
import { defaultColor } from "./core/defaultColor";

const ColorPickerCore = dynamic(() => import("./core/components/ColorPicker"), {
  loading: ({ error, isLoading, retry }) => (
    <div className={"flex-center"} style={{ minHeight: "300px" }}>
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

const ColorPicker = (props: ColorPickerProps): React.ReactElement => {
  const { children, ...rest } = props;
  return (
    <Root>
      <Trigger aria-label="Pick a color" asChild>
        {children}
      </Trigger>
      <Portal>
        <Content className={styles.content} collisionPadding={8} sideOffset={5}>
          <Provider>
            <HydrateAtoms
              initialValues={[
                [
                  previewColorAtom,
                  rest?.defaultValue?.str ||
                    rest?.value?.str ||
                    defaultColor.str
                ]
              ]}
            >
              <div className={clsx("flex-center", styles.header)}>
                <Preview />
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
            </HydrateAtoms>
          </Provider>
          <Arrow className={styles.arrow} />
        </Content>
      </Portal>
    </Root>
  );
};

export default ColorPicker;
