import { DeviceType } from "@storiny/shared";
import React from "react";

import DeviceComputerIcon from "~/icons/DeviceComputer";
import DeviceConsoleIcon from "~/icons/DeviceConsole";
import DeviceMobileIcon from "~/icons/DeviceMobile";
import DeviceTabletIcon from "~/icons/DeviceTablet";
import DeviceTVIcon from "~/icons/DeviceTV";
import QuestionMarkIcon from "~/icons/QuestionMark";

const NullComponent = (): null => null;

export const deviceTypeToIconMap: Record<DeviceType, React.ReactNode> = {
  [DeviceType.COMPUTER]: <DeviceComputerIcon />,
  [DeviceType.MOBILE]: <DeviceMobileIcon />,
  [DeviceType.TABLET]: <DeviceTabletIcon />,
  [DeviceType.SMART_TV]: <DeviceTVIcon />,
  [DeviceType.CONSOLE]: <DeviceConsoleIcon />,
  [DeviceType.UNKNOWN]: <QuestionMarkIcon />,
  [DeviceType.UNRECOGNIZED]: <NullComponent />,
  [DeviceType.UNSPECIFIED]: <NullComponent />
};
