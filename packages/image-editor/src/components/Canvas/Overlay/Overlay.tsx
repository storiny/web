import clsx from "clsx";
import { useAtom } from "jotai";
import React from "react";

import Button from "~/components/Button";
import IconButton from "~/components/IconButton";
import Input from "~/components/Input";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import Separator from "~/components/Separator";
import ChevronIcon from "~/icons/Chevron";
import MinusIcon from "~/icons/Minus";
import PlusIcon from "~/icons/Plus";

import { zoomAtom } from "../../../atoms";
import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } from "../../../constants";
import styles from "./Overlay.module.scss";

const ZoomControl = (): React.ReactElement => {
  const [zoom, setZoom] = useAtom(zoomAtom);

  /**
   * Decrements zoom level
   * @param value Decrement value
   */
  const decrementZoom = (value: number = 10): void => {
    setZoom(zoom - value);
  };

  /**
   * Increments zoom level
   * @param value Increment level
   */
  const incrementZoom = (value: number = 10): void => {
    setZoom(zoom + value);
  };

  return (
    <div className={clsx("flex-center", styles.x, styles.zoom)}>
      <IconButton
        aria-label={"Decrement zoom level"}
        className={clsx(styles.x, styles["zoom-icon-button"])}
        disabled={zoom <= 1}
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
        <Input
          max={MAX_ZOOM_LEVEL}
          min={MIN_ZOOM_LEVEL}
          onChange={(event): void => {
            setZoom(Number.parseInt(event.target.value));
          }}
          placeholder={"Zoom level"}
          size={"sm"}
          type={"number"}
          value={zoom}
        />
        <Separator />
        <MenuItem
          disabled={zoom >= MAX_ZOOM_LEVEL}
          onClick={(): void => incrementZoom()}
          onSelect={(event): void => event.preventDefault()}
        >
          Zoom in
        </MenuItem>
        <MenuItem
          disabled={zoom <= 1}
          onClick={(): void => decrementZoom()}
          onSelect={(event): void => event.preventDefault()}
        >
          Zoom out
        </MenuItem>
        <MenuItem
          onClick={(): void => {
            setZoom(100);
          }}
        >
          Zoom to 100%
        </MenuItem>
      </Menu>
      <IconButton
        aria-label={"Increment zoom level"}
        className={clsx(styles.x, styles["zoom-icon-button"])}
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
