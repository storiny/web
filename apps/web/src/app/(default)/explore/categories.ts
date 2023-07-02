import { StoryCategory } from "@storiny/shared";
import React from "react";

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

export const categories: Array<{
  Icon: React.FC;
  id: StoryCategory | "all";
  title: string;
}> = [
  {
    id: "all",
    title: "All categories",
    Icon: CategoryIcon
  },
  {
    id: StoryCategory.SCIENCE_AND_TECHNOLOGY,
    title: "Science & technology",
    Icon: BulbIcon
  },
  {
    id: StoryCategory.PROGRAMMING,
    title: "Programming",
    Icon: ScriptIcon
  },
  {
    id: StoryCategory.LIFESTYLE,
    title: "Lifestyle",
    Icon: CupIcon
  },
  {
    id: StoryCategory.HEALTH_AND_WELLNESS,
    title: "Health & wellness",
    Icon: HeartbeatIcon
  },
  {
    id: StoryCategory.ENTERTAINMENT,
    title: "Entertainment",
    Icon: DeviceTVIcon
  },
  {
    id: StoryCategory.DIGITAL_GRAPHICS,
    title: "Digital graphics",
    Icon: BrushIcon
  },
  {
    id: StoryCategory.TRAVEL,
    title: "Travel",
    Icon: MapIcon
  },
  {
    id: StoryCategory.DIY,
    title: "DIY",
    Icon: ToolsIcon
  },
  {
    id: StoryCategory.NEWS,
    title: "News",
    Icon: StoryIcon
  },
  {
    id: StoryCategory.SPORTS,
    title: "Sports",
    Icon: BasketballIcon
  },
  {
    id: StoryCategory.GAMING,
    title: "Gaming",
    Icon: GamepadIcon
  },
  {
    id: StoryCategory.MUSIC,
    title: "Music",
    Icon: MusicIcon
  },
  {
    id: StoryCategory.LEARNING,
    title: "Learning",
    Icon: BooksIcon
  },
  {
    id: StoryCategory.BUSINESS_AND_FINANCE,
    title: "Business & finance",
    Icon: CoinsIcon
  }
];
