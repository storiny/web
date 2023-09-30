"use client";

import SuspenseLoader from "@storiny/web/src/common/suspense-loader";
import clsx from "clsx";
import { Provider } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import IconButton from "~/components/icon-button";
import Popover, { Close } from "~/components/popover";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { preview_color_atom } from "~/entities/color-picker/core/atoms";
import CloudOffIcon from "~/icons/cloud-off";
import XIcon from "~/icons/x";

import styles from "./color-picker.module.scss";
import { ColorPickerProps } from "./color-picker.props";
import HydrateAtoms from "./core/components/hydrate-atoms";
import Preview from "./core/components/preview";
import { DEFAULT_COLOR } from "./core/default-color";

const ColorPickerCore = dynamic(
  () => import("./core/components/color-picker"),
  {
    loading: ({ error, isLoading: is_loading, retry }) => (
      <div className={"flex-center"} style={{ minHeight: "300px" }}>
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
  }
);

const ColorPicker = (props: ColorPickerProps): React.ReactElement => {
  const { children, popover_props, ...rest } = props;
  return (
    <Popover
      slot_props={{
        trigger: { "aria-label": "Pick a color" }
      }}
      {...popover_props}
      className={clsx(styles.popover, popover_props?.className)}
      trigger={children}
    >
      <Provider>
        <HydrateAtoms
          initial_values={[
            [
              preview_color_atom,
              rest?.default_value?.str || rest?.value?.str || DEFAULT_COLOR.str
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
    </Popover>
  );
};

export default ColorPicker;
