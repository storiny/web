import { Item as Option } from "@radix-ui/react-select";
import clsx from "clsx";
import { Point } from "fabric";
import { useAtom } from "jotai";
import React from "react";

import Button from "~/components/Button";
import Grow from "~/components/Grow";
import IconButton from "~/components/IconButton";
import Input from "~/components/Input";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import Select from "~/components/Select";
import Separator from "~/components/Separator";
import ChevronIcon from "~/icons/Chevron";
import MinusIcon from "~/icons/Minus";
import PlusIcon from "~/icons/Plus";
import { capitalize } from "~/utils/capitalize";
import { clamp } from "~/utils/clamp";

import { patternAtom } from "../../../atoms";
import {
  CanvasPattern,
  MAX_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL
} from "../../../constants";
import { useCanvas, useEventRender } from "../../../hooks";
import styles from "./Overlay.module.scss";

const patternToSvg: Record<CanvasPattern, React.ReactNode> = {
  [CanvasPattern.CHECKERED]: (
    <svg
      className={clsx(styles.x, styles["pattern-svg"])}
      fill="none"
      viewBox="0 0 16 16"
    >
      <path d="M8 8h8v8H8V8ZM0 0h8v8H0V0Z" fill="var(--inverted-200)" />
    </svg>
  ),
  [CanvasPattern.DOTTED]: (
    <svg
      className={clsx(styles.x, styles["pattern-svg"])}
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M13 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM5 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM13 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM13 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM5 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
        fill="var(--inverted-200)"
      />
    </svg>
  ),
  [CanvasPattern.GRID]: (
    <svg
      className={clsx(styles.x, styles["pattern-svg"])}
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M11.5 0h.5v16h-.5V0ZM4 0h.5v16H4V0Z"
        fill="var(--inverted-100)"
      />
      <path
        d="M0 4.5V4h16v.5H0ZM0 12v-.5h16v.5H0Z"
        fill="var(--inverted-100)"
      />
      <path d="M0 8.5v-1h16v1H0Z" fill="var(--inverted-200)" />
      <path d="M7.5 0h1v16h-1V0Z" fill="var(--inverted-200)" />
    </svg>
  ),
  [CanvasPattern.NONE]: null
};

// Zoom control

const ZoomControl = (): React.ReactElement => {
  const canvas = useCanvas();
  const [zoom, setZoom] = React.useState<number>(100);
  useEventRender("mouse:wheel", () => {
    if (canvas.current) {
      setZoom(Math.round(canvas.current.getZoom() * 100));
    }

    return false;
  });

  /**
   * Zooms to the center of the canvas with the provided value
   * @param value Zoom value
   */
  const setCanvasZoom = (value: number): void => {
    setZoom(Math.round(value * 100));

    if (canvas.current) {
      canvas.current.zoomToPoint(
        new Point(canvas.current.width / 2, canvas.current.height / 2),
        clamp(MIN_ZOOM_LEVEL, value * 100, MAX_ZOOM_LEVEL) / 100
      );
    }
  };

  /**
   * Decrements zoom level
   * @param value Decrement value
   */
  const decrementZoom = (value: number = 10): void => {
    setCanvasZoom((canvas.current.getZoom() * 100 - value) / 100);
  };

  /**
   * Increments zoom level
   * @param value Increment level
   */
  const incrementZoom = (value: number = 10): void => {
    setCanvasZoom((canvas.current.getZoom() * 100 + value) / 100);
  };

  React.useEffect(() => {
    if (canvas.current) {
      setZoom(Math.round(canvas.current.getZoom() * 100));
    }
  }, [canvas]);

  return (
    <div className={clsx("flex-center", styles.x, styles.zoom)}>
      <IconButton
        aria-label={"Decrement zoom level"}
        className={clsx("focus-invert", styles.x, styles["zoom-icon-button"])}
        disabled={zoom <= MIN_ZOOM_LEVEL}
        onClick={(): void => decrementZoom()}
        title={"Decrement zoom level"}
        variant={"ghost"}
      >
        <MinusIcon />
      </IconButton>
      <Menu
        trigger={
          <Button
            aria-label={"Change zoom level"}
            className={clsx(
              "t-major",
              "t-bold",
              "focus-invert",
              styles.x,
              styles["zoom-trigger"]
            )}
            title={"Change zoom level"}
            variant={"ghost"}
          >
            <span>{zoom}%</span>
            <ChevronIcon rotation={180} />
          </Button>
        }
      >
        <div
          className={clsx(
            "flex-center",
            styles.x,
            styles["zoom-input-wrapper"]
          )}
        >
          <Input
            max={MAX_ZOOM_LEVEL}
            min={MIN_ZOOM_LEVEL}
            onChange={(event): void => {
              setCanvasZoom(Number.parseInt(event.target.value, 10) / 100);
            }}
            placeholder={"Zoom level"}
            size={"sm"}
            type={"number"}
            value={zoom}
          />
        </div>
        <Separator />
        <MenuItem
          disabled={zoom >= MAX_ZOOM_LEVEL}
          onClick={(): void => incrementZoom()}
          onSelect={(event): void => event.preventDefault()}
        >
          Zoom in
          <Grow />
          <span>+</span>
        </MenuItem>
        <MenuItem
          disabled={zoom <= MIN_ZOOM_LEVEL}
          onClick={(): void => decrementZoom()}
          onSelect={(event): void => event.preventDefault()}
        >
          Zoom out
          <Grow />
          <span>-</span>
        </MenuItem>
        <MenuItem onClick={(): void => setCanvasZoom(1)}>Zoom to 100%</MenuItem>
      </Menu>
      <IconButton
        aria-label={"Increment zoom level"}
        className={clsx("focus-invert", styles.x, styles["zoom-icon-button"])}
        disabled={zoom >= MAX_ZOOM_LEVEL}
        onClick={(): void => incrementZoom()}
        title={"Increment zoom level"}
        variant={"ghost"}
      >
        <PlusIcon />
      </IconButton>
    </div>
  );
};

// Pattern control

const PatternControl = (): React.ReactElement => {
  const [pattern, setPattern] = useAtom(patternAtom);

  return (
    <Select
      onValueChange={(newValue): void => {
        setPattern(newValue as CanvasPattern);
      }}
      slotProps={{
        content: {
          sideOffset: 8,
          position: "popper"
        },
        viewport: {
          className: clsx("flex", styles.x, styles.viewport)
        },
        value: { placeholder: "Canvas pattern" },
        trigger: {
          className: clsx("focus-invert", styles.x, styles["pattern-trigger"]),
          "aria-label": "Choose canvas background pattern",
          title: "Choose background pattern"
        }
      }}
      value={pattern}
      valueChildren={
        <span
          className={clsx(styles.x, styles.option)}
          style={{
            marginLeft: "-3px"
          }}
        >
          {patternToSvg[pattern]}
        </span>
      }
    >
      {[
        CanvasPattern.NONE,
        CanvasPattern.GRID,
        CanvasPattern.CHECKERED,
        CanvasPattern.DOTTED
      ].map((pattern) => (
        <Option
          aria-label={
            pattern === CanvasPattern.NONE
              ? "None"
              : `${capitalize(pattern)} pattern`
          }
          aria-labelledby={undefined}
          className={clsx(styles.x, styles.option)}
          key={pattern}
          title={
            pattern === CanvasPattern.NONE
              ? "None"
              : `${capitalize(pattern)} pattern`
          }
          value={pattern}
        >
          {patternToSvg[pattern]}
        </Option>
      ))}
    </Select>
  );
};

const Overlay = (): React.ReactElement => (
  <React.Fragment>
    <div className={clsx("flex-center", styles.x, styles["primary-controls"])}>
      <ZoomControl />
      <PatternControl />
    </div>
  </React.Fragment>
);

export default Overlay;
