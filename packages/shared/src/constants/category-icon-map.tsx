import BasketballIcon from "@storiny/ui/src/icons/Basketball";
import BooksIcon from "@storiny/ui/src/icons/Books";
import BrushIcon from "@storiny/ui/src/icons/Brush";
import BulbIcon from "@storiny/ui/src/icons/Bulb";
import CategoryIcon from "@storiny/ui/src/icons/Category";
import CoinsIcon from "@storiny/ui/src/icons/Coins";
import CupIcon from "@storiny/ui/src/icons/Cup";
import DeviceTVIcon from "@storiny/ui/src/icons/DeviceTV";
import GamepadIcon from "@storiny/ui/src/icons/Gamepad";
import HeartbeatIcon from "@storiny/ui/src/icons/Heartbeat";
import MapIcon from "@storiny/ui/src/icons/Map";
import MusicIcon from "@storiny/ui/src/icons/Music";
import ScriptIcon from "@storiny/ui/src/icons/Script";
import StoryIcon from "@storiny/ui/src/icons/Story";
import ToolsIcon from "@storiny/ui/src/icons/Tools";
import React from "react";

import { StoryCategory } from "../enums";

export const CATEGORY_ICON_MAP: Record<StoryCategory | "all", React.ReactNode> =
  {
    ["all" /*                               */]: <CategoryIcon />,
    [StoryCategory.OTHERS /*                */]: <CategoryIcon />,
    [StoryCategory.BUSINESS_AND_FINANCE /*  */]: <CoinsIcon />,
    [StoryCategory.DIY /*                   */]: <ToolsIcon />,
    [StoryCategory.DIGITAL_GRAPHICS /*      */]: <BrushIcon />,
    [StoryCategory.ENTERTAINMENT /*         */]: <DeviceTVIcon />,
    [StoryCategory.GAMING /*                */]: <GamepadIcon />,
    [StoryCategory.HEALTH_AND_WELLNESS /*   */]: <HeartbeatIcon />,
    [StoryCategory.LEARNING /*              */]: <BooksIcon />,
    [StoryCategory.LIFESTYLE /*             */]: <CupIcon />,
    [StoryCategory.MUSIC /*                 */]: <MusicIcon />,
    [StoryCategory.NEWS /*                  */]: <StoryIcon />,
    [StoryCategory.PROGRAMMING /*           */]: <ScriptIcon />,
    [StoryCategory.SCIENCE_AND_TECHNOLOGY /**/]: <BulbIcon />,
    [StoryCategory.SPORTS /*                */]: <BasketballIcon />,
    [StoryCategory.TRAVEL /*                */]: <MapIcon />
  };
