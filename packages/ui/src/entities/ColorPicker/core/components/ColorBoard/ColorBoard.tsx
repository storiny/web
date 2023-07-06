"use client";

import { Root as VisuallyHidden } from "@radix-ui/react-visually-hidden";
import clsx from "clsx";
import React from "react";

import { useColorBoard } from "../../hooks";
import commonStyles from "../common.module.scss";
import styles from "./ColorBoard.module.scss";
import { ColorBoardProps } from "./ColorBoard.props";

const SV_MAX = 100;

const ColorBoard = (props: ColorBoardProps): React.ReactElement => {
  const { state, className, style, ...rest } = props;
  const ref = React.useRef<HTMLDivElement>(null);
  const { containerProps, descriptionProps } = useColorBoard({
    state,
    ref
  });

  // Focus on mount
  React.useEffect(() => ref.current?.focus?.(), []);

  return (
    <div
      {...rest}
      {...containerProps}
      className={clsx(styles.container, className)}
      ref={ref}
      style={{ ...style, background: state.getSolidColor() }}
      tabIndex={0}
    >
      <VisuallyHidden {...descriptionProps} />
      <span
        className={commonStyles.thumb}
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
      <span className={clsx(commonStyles.overlay, styles.light)} />
      <span className={clsx(commonStyles.overlay, styles.dark)} />
    </div>
  );
};

export default ColorBoard;
