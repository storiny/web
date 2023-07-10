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
  ...rest
}: TooltipProps): React.ReactElement => (
  <Tooltip
    {...rest}
    slotProps={{
      ...slotProps,
      content: { ...slotProps?.content, side: "right" }
    }}
  />
);

const Tabs = (): React.ReactElement => (
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
          decorator={<AdjustIcon />}
          value={Tab.ADJUST}
        />
      </PositionedTooltip>
      <PositionedTooltip content={"Crop"}>
        <TabPrimitive
          aria-label={"Crop"}
          className={clsx(styles.x, styles.tab)}
          decorator={<CropIcon />}
          value={Tab.CROP}
        />
      </PositionedTooltip>
      <PositionedTooltip content={"Tune"}>
        <TabPrimitive
          aria-label={"Tune"}
          className={clsx(styles.x, styles.tab)}
          decorator={<TuneIcon />}
          value={Tab.TUNE}
        />
      </PositionedTooltip>
      <PositionedTooltip content={"Filters"}>
        <TabPrimitive
          aria-label={"Filters"}
          className={clsx(styles.x, styles.tab)}
          decorator={<FiltersIcon />}
          value={Tab.FILTERS}
        />
      </PositionedTooltip>
      <PositionedTooltip content={"Draw"}>
        <TabPrimitive
          aria-label={"Draw"}
          className={clsx(styles.x, styles.tab)}
          decorator={<PencilIcon />}
          value={Tab.DRAW}
        />
      </PositionedTooltip>
      <PositionedTooltip content={"Shape"}>
        <TabPrimitive
          aria-label={"Shape"}
          className={clsx(styles.x, styles.tab)}
          decorator={<ShapeIcon />}
          value={Tab.SHAPE}
        />
      </PositionedTooltip>
    </TabsList>
  </TabsPrimitive>
);

export default Tabs;
