"use client";

import { StoryCategory } from "@storiny/shared";
import { clsx } from "clsx";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import React from "react";

import Divider from "~/components/Divider";
import Option, { OptionProps } from "~/components/Option";
import Select from "~/components/Select";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import BasketballIcon from "~/icons/Basketball";
import BooksIcon from "~/icons/Books";
import BrushIcon from "~/icons/Brush";
import BulbIcon from "~/icons/Bulb";
import CategoryIcon from "~/icons/Category";
import CoinsIcon from "~/icons/Coins";
import CupIcon from "~/icons/Cup";
import DeviceTVIcon from "~/icons/DeviceTV";
import GamepadIcon from "~/icons/Gamepad";
import HeartbeatIcon from "~/icons/Heartbeat";
import MapIcon from "~/icons/Map";
import MusicIcon from "~/icons/Music";
import ScriptIcon from "~/icons/Script";
import StoryIcon from "~/icons/Story";
import ToolsIcon from "~/icons/Tools";
import { breakpoints } from "~/theme/breakpoints";

import styles from "./dropdown.module.scss";

const categoryIconMap: Record<StoryCategory | "all", React.ReactNode> = {
  all: <CategoryIcon />,
  [StoryCategory.BUSINESS_AND_FINANCE]: <CoinsIcon />,
  [StoryCategory.DIY]: <ToolsIcon />,
  [StoryCategory.DIGITAL_GRAPHICS]: <BrushIcon />,
  [StoryCategory.ENTERTAINMENT]: <DeviceTVIcon />,
  [StoryCategory.GAMING]: <GamepadIcon />,
  [StoryCategory.HEALTH_AND_WELLNESS]: <HeartbeatIcon />,
  [StoryCategory.LEARNING]: <BooksIcon />,
  [StoryCategory.LIFESTYLE]: <CupIcon />,
  [StoryCategory.MUSIC]: <MusicIcon />,
  [StoryCategory.NEWS]: <StoryIcon />,
  [StoryCategory.PROGRAMMING]: <ScriptIcon />,
  [StoryCategory.SCIENCE_AND_TECHNOLOGY]: <BulbIcon />,
  [StoryCategory.SPORTS]: <BasketballIcon />,
  [StoryCategory.TRAVEL]: <MapIcon />
};

// Anchor option

const AnchorOption = ({
  children,
  value,
  ...rest
}: Omit<OptionProps, "value"> & {
  value: StoryCategory | "all";
}): React.ReactElement => (
  <Option {...rest} value={value}>
    {children}
  </Option>
);

const DropdownClient = (): React.ReactElement => {
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const router = useRouter();
  const segment = useSelectedLayoutSegment();

  return (
    <>
      <Divider orientation={"vertical"} />
      <Select
        onValueChange={(value): void =>
          router.push(`/explore${value === "all" ? "" : `/${value}`}`)
        }
        size={"lg"}
        slotProps={{
          trigger: {
            className: clsx("ellipsis", styles.x, styles.trigger)
          }
        }}
        value={segment || "all"}
        valueChildren={isMobile ? categoryIconMap[segment || "all"] : undefined}
      >
        <AnchorOption decorator={categoryIconMap.all} value={"all"}>
          All categories
        </AnchorOption>
        <AnchorOption
          decorator={categoryIconMap["science-and-technology"]}
          value={StoryCategory.SCIENCE_AND_TECHNOLOGY}
        >
          Science & technology
        </AnchorOption>
        <AnchorOption
          decorator={categoryIconMap.programming}
          value={StoryCategory.PROGRAMMING}
        >
          Programming
        </AnchorOption>
        <AnchorOption
          decorator={categoryIconMap.lifestyle}
          value={StoryCategory.LIFESTYLE}
        >
          Lifestyle
        </AnchorOption>
        <AnchorOption
          decorator={categoryIconMap["health-and-wellness"]}
          value={StoryCategory.HEALTH_AND_WELLNESS}
        >
          Health & wellness
        </AnchorOption>
        <AnchorOption
          decorator={categoryIconMap.entertainment}
          value={StoryCategory.ENTERTAINMENT}
        >
          Entertainment
        </AnchorOption>
        <AnchorOption
          decorator={categoryIconMap["digital-graphics"]}
          value={StoryCategory.DIGITAL_GRAPHICS}
        >
          Digital graphics
        </AnchorOption>
        <AnchorOption
          decorator={categoryIconMap.travel}
          value={StoryCategory.TRAVEL}
        >
          Travel
        </AnchorOption>
        <AnchorOption decorator={categoryIconMap.diy} value={StoryCategory.DIY}>
          DIY
        </AnchorOption>
        <AnchorOption
          decorator={categoryIconMap.news}
          value={StoryCategory.NEWS}
        >
          News
        </AnchorOption>
        <AnchorOption
          decorator={categoryIconMap.sports}
          value={StoryCategory.SPORTS}
        >
          Sports
        </AnchorOption>
        <AnchorOption
          decorator={categoryIconMap.gaming}
          value={StoryCategory.GAMING}
        >
          Gaming
        </AnchorOption>
        <AnchorOption
          decorator={categoryIconMap.music}
          value={StoryCategory.MUSIC}
        >
          Music
        </AnchorOption>
        <AnchorOption
          decorator={categoryIconMap.learning}
          value={StoryCategory.LEARNING}
        >
          Learning
        </AnchorOption>
        <AnchorOption
          decorator={categoryIconMap["business-and-finance"]}
          value={StoryCategory.BUSINESS_AND_FINANCE}
        >
          Business & finance
        </AnchorOption>
      </Select>
    </>
  );
};

export default DropdownClient;
