import clsx from "clsx";
import { Point } from "fabric";
import React from "react";

import Button from "~/components/Button";
import Grow from "~/components/Grow";
import IconButton from "~/components/IconButton";
import Input from "~/components/Input";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import Separator from "~/components/Separator";
import ChevronIcon from "~/icons/Chevron";
import MinusIcon from "~/icons/Minus";
import PlusIcon from "~/icons/Plus";
import { clamp } from "~/utils/clamp";

import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } from "../../../constants";
import { useCanvas, useEventRender } from "../../../hooks";
import styles from "./overlay.module.scss";

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
        slotProps={{
          content: {
            style: {
              zIndex: "calc(var(--z-index-modal) + 2)"
            }
          }
        }}
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

const Overlay = (): React.ReactElement => (
  <React.Fragment>
    <div className={clsx("flex-center", styles.x, styles["primary-controls"])}>
      <ZoomControl />
    </div>
  </React.Fragment>
);

export default Overlay;
