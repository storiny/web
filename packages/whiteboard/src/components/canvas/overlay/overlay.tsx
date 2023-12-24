import clsx from "clsx";
import { Point } from "fabric";
import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import IconButton from "~/components/icon-button";
import Input from "~/components/input";
import Menu from "~/components/menu";
import MenuItem from "~/components/menu-item";
import Separator from "~/components/separator";
import ChevronIcon from "~/icons/chevron";
import MinusIcon from "~/icons/minus";
import PlusIcon from "~/icons/plus";
import css from "~/theme/main.module.scss";
import { clamp } from "~/utils/clamp";

import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } from "../../../constants";
import { use_canvas, use_event_render } from "../../../hooks";
import styles from "./overlay.module.scss";

// Zoom control

const ZoomControl = (): React.ReactElement => {
  const canvas = use_canvas();
  const [zoom, set_zoom] = React.useState<number>(100);
  use_event_render("mouse:wheel", () => {
    if (canvas.current) {
      set_zoom(Math.round(canvas.current.getZoom() * 100));
    }

    return false;
  });

  /**
   * Zooms to the center of the canvas with the provided value
   * @param value Zoom value
   */
  const set_canvas_zoom = (value: number): void => {
    set_zoom(Math.round(value * 100));

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
  const decrement_zoom = (value = 10): void => {
    set_canvas_zoom((canvas.current.getZoom() * 100 - value) / 100);
  };

  /**
   * Increments zoom level
   * @param value Increment level
   */
  const increment_zoom = (value = 10): void => {
    set_canvas_zoom((canvas.current.getZoom() * 100 + value) / 100);
  };

  React.useEffect(() => {
    if (canvas.current) {
      set_zoom(Math.round(canvas.current.getZoom() * 100));
    }
  }, [canvas]);

  return (
    <div className={clsx(css["flex-center"], styles.zoom)}>
      <IconButton
        aria-label={"Decrement zoom level"}
        className={clsx(
          css["focus-invert"],
          styles.x,
          styles["zoom-icon-button"]
        )}
        disabled={zoom <= MIN_ZOOM_LEVEL}
        onClick={(): void => decrement_zoom()}
        title={"Decrement zoom level"}
        variant={"ghost"}
      >
        <MinusIcon />
      </IconButton>
      <Menu
        slot_props={{
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
              css["t-major"],
              css["t-bold"],
              css["focus-invert"],
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
            css["flex-center"],
            css["full-w"],
            styles["zoom-input-wrapper"]
          )}
        >
          <Input
            max={MAX_ZOOM_LEVEL}
            min={MIN_ZOOM_LEVEL}
            onChange={(event): void => {
              set_canvas_zoom(Number.parseInt(event.target.value, 10) / 100);
            }}
            placeholder={"Zoom level"}
            size={"sm"}
            slot_props={{
              container: {
                className: css["full-w"]
              }
            }}
            type={"number"}
            value={zoom}
          />
        </div>
        <Separator />
        <MenuItem
          disabled={zoom >= MAX_ZOOM_LEVEL}
          onClick={(): void => increment_zoom()}
          onSelect={(event): void => event.preventDefault()}
        >
          Zoom in
          <Grow />
          <span>+</span>
        </MenuItem>
        <MenuItem
          disabled={zoom <= MIN_ZOOM_LEVEL}
          onClick={(): void => decrement_zoom()}
          onSelect={(event): void => event.preventDefault()}
        >
          Zoom out
          <Grow />
          <span>-</span>
        </MenuItem>
        <MenuItem onClick={(): void => set_canvas_zoom(1)}>
          Zoom to 100%
        </MenuItem>
      </Menu>
      <IconButton
        aria-label={"Increment zoom level"}
        className={clsx(
          css["focus-invert"],
          styles.x,
          styles["zoom-icon-button"]
        )}
        disabled={zoom >= MAX_ZOOM_LEVEL}
        onClick={(): void => increment_zoom()}
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
    <div className={clsx(css["flex-center"], styles["primary-controls"])}>
      <ZoomControl />
    </div>
  </React.Fragment>
);

export default Overlay;
