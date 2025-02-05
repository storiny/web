"use client";

import clsx from "clsx";
import { VisuallyHidden } from "radix-ui";
import React from "react";

import { use_color_board } from "../../hooks";
import common_styles from "../common.module.scss";
import styles from "./color-board.module.scss";
import { ColorBoardProps } from "./color-board.props";

const SV_MAX = 100;

const ColorBoard = (props: ColorBoardProps): React.ReactElement => {
  const { state, className, style, ...rest } = props;
  const ref = React.useRef<HTMLDivElement>(null);
  const { container_props, description_props } = use_color_board({
    state,
    ref
  });

  // Focus on mount
  React.useEffect(() => ref.current?.focus?.(), []);

  return (
    <div
      {...rest}
      {...container_props}
      className={clsx(styles.container, className)}
      ref={ref}
      style={{ ...style, background: state.get_solid_color() }}
      tabIndex={0}
    >
      <VisuallyHidden.Root {...description_props} />
      <span
        className={common_styles.thumb}
        data-testid={"color-board-thumb"}
        style={
          {
            ...style,
            "--color": `#${state.color.hex}`,
            left: `${state.color.s}%`,
            top: `${SV_MAX - state.color.v}%`
          } as React.CSSProperties
        }
      />
      <span className={clsx(common_styles.overlay, styles.light)} />
      <span className={clsx(common_styles.overlay, styles.dark)} />
    </div>
  );
};

export default ColorBoard;
