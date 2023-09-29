import BasketballIcon from "@storiny/ui/src/icons/basketball";
import BooksIcon from "@storiny/ui/src/icons/books";
import BrushIcon from "@storiny/ui/src/icons/brush";
import BulbIcon from "@storiny/ui/src/icons/bulb";
import CategoryIcon from "@storiny/ui/src/icons/category";
import CoinsIcon from "@storiny/ui/src/icons/coins";
import CupIcon from "@storiny/ui/src/icons/cup";
import DeviceTVIcon from "@storiny/ui/src/icons/device-tv";
import GamepadIcon from "@storiny/ui/src/icons/gamepad";
import HeartbeatIcon from "@storiny/ui/src/icons/heartbeat";
import MapIcon from "@storiny/ui/src/icons/map";
import MusicIcon from "@storiny/ui/src/icons/music";
import ScriptIcon from "@storiny/ui/src/icons/script";
import StoryIcon from "@storiny/ui/src/icons/story";
import ToolsIcon from "@storiny/ui/src/icons/tools";
import React from "react";

import { StoryCategory } from "../../enums";

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

export const CATEGORY_LABEL_MAP: Record<StoryCategory | "all", string> = {
  ["all" /*                               */]: "All categories",
  [StoryCategory.OTHERS /*                */]: "Others",
  [StoryCategory.BUSINESS_AND_FINANCE /*  */]: "Business & finance",
  [StoryCategory.DIY /*                   */]: "DIY",
  [StoryCategory.DIGITAL_GRAPHICS /*      */]: "Digital graphics",
  [StoryCategory.ENTERTAINMENT /*         */]: "Entertainment",
  [StoryCategory.GAMING /*                */]: "Gaming",
  [StoryCategory.HEALTH_AND_WELLNESS /*   */]: "Health & wellness",
  [StoryCategory.LEARNING /*              */]: "Learning",
  [StoryCategory.LIFESTYLE /*             */]: "Lifestyle",
  [StoryCategory.MUSIC /*                 */]: "Music",
  [StoryCategory.NEWS /*                  */]: "News",
  [StoryCategory.PROGRAMMING /*           */]: "Programming",
  [StoryCategory.SCIENCE_AND_TECHNOLOGY /**/]: "Science & technology",
  [StoryCategory.SPORTS /*                */]: "Sports",
  [StoryCategory.TRAVEL /*                */]: "Travel"
};
