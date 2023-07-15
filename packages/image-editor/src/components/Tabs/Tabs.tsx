import clsx from "clsx";
import React from "react";

import TabPrimitive from "~/components/Tab";
import TabsPrimitive from "~/components/Tabs";
import TabsList from "~/components/TabsList";
import Tooltip, { TooltipProps } from "~/components/Tooltip";
import AdjustIcon from "~/icons/Adjust";
import CropIcon from "~/icons/Crop";
import FiltersIcon from "~/icons/Filters";
import PencilIcon from "~/icons/Pencil";
import ShapeIcon from "~/icons/Shape";
import TuneIcon from "~/icons/Tune";

import { Tab } from "../../constants";
import styles from "./Tabs.module.scss";

// Tooltip with right position

const PositionedTooltip = ({
  slotProps,
  children,
  ...rest
}: TooltipProps): React.ReactLayer => (
  <Tooltip
    {...rest}
    slotProps={{
      ...slotProps,
      content: { ...slotProps?.content, side: "right" }
    }}
  >
    <span>{children}</span>
  </Tooltip>
);

const Tabs = (): React.ReactLayer => (
  <TabsPrimitive
    className={clsx(styles.x, styles.tabs)}
    defaultValue={Tab.ADJUST}
    orientation={"vertical"}
  >
    <TabsList>
      <PositionedTooltip content={"Adjust"}>
        <TabPrimitive
          aria-label={"Adjust"}
          className={clsx(styles.x, styles.tab)}
          decorator={<AdjustIcon className={clsx(styles.x, styles.icon)} />}
          value={Tab.ADJUST}
        />
      </PositionedTooltip>
      <PositionedTooltip content={"Crop"}>
        <TabPrimitive
          aria-label={"Crop"}
          className={clsx(styles.x, styles.tab)}
          decorator={<CropIcon className={clsx(styles.x, styles.icon)} />}
          value={Tab.CROP}
        />
      </PositionedTooltip>
      <PositionedTooltip content={"Tune"}>
        <TabPrimitive
          aria-label={"Tune"}
          className={clsx(styles.x, styles.tab)}
          decorator={<TuneIcon className={clsx(styles.x, styles.icon)} />}
          value={Tab.TUNE}
        />
      </PositionedTooltip>
      <PositionedTooltip content={"Filters"}>
        <TabPrimitive
          aria-label={"Filters"}
          className={clsx(styles.x, styles.tab)}
          decorator={<FiltersIcon className={clsx(styles.x, styles.icon)} />}
          value={Tab.FILTERS}
        />
      </PositionedTooltip>
      <PositionedTooltip content={"Draw"}>
        <TabPrimitive
          aria-label={"Draw"}
          className={clsx(styles.x, styles.tab)}
          decorator={<PencilIcon className={clsx(styles.x, styles.icon)} />}
          value={Tab.DRAW}
        />
      </PositionedTooltip>
      <PositionedTooltip content={"Shape"}>
        <TabPrimitive
          aria-label={"Shape"}
          className={clsx(styles.x, styles.tab)}
          decorator={<ShapeIcon className={clsx(styles.x, styles.icon)} />}
          value={Tab.SHAPE}
        />
      </PositionedTooltip>
    </TabsList>
  </TabsPrimitive>
);

export default Tabs;
