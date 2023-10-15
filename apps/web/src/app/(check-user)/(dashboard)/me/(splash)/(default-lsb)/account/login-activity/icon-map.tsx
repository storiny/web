import { DeviceType } from "@storiny/shared";
import React from "react";

import DeviceComputerIcon from "~/icons/device-computer";
import DeviceMobileIcon from "~/icons/device-mobile";
import DeviceTabletIcon from "~/icons/device-tablet";
import QuestionMarkIcon from "~/icons/question-mark";

const NullComponent = (): null => null;

export const DEVICE_TYPE_ICON_MAP: Record<DeviceType, React.ReactNode> = {
  [DeviceType.COMPUTER /*    */]: <DeviceComputerIcon />,
  [DeviceType.MOBILE /*      */]: <DeviceMobileIcon />,
  [DeviceType.TABLET /*      */]: <DeviceTabletIcon />,
  [DeviceType.UNKNOWN /*     */]: <QuestionMarkIcon />,
  [DeviceType.UNRECOGNIZED /**/]: <NullComponent />,
  [DeviceType.UNSPECIFIED /* */]: <NullComponent />
};
