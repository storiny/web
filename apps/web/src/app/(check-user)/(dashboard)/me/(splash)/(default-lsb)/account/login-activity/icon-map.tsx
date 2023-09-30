import { DeviceType } from "@storiny/shared";
import React from "react";

import DeviceComputerIcon from "../../../../../../../../../../../packages/ui/src/icons/device-computer";
import DeviceConsoleIcon from "../../../../../../../../../../../packages/ui/src/icons/device-console";
import DeviceMobileIcon from "../../../../../../../../../../../packages/ui/src/icons/device-mobile";
import DeviceTabletIcon from "../../../../../../../../../../../packages/ui/src/icons/device-tablet";
import DeviceTVIcon from "../../../../../../../../../../../packages/ui/src/icons/device-tv";
import QuestionMarkIcon from "../../../../../../../../../../../packages/ui/src/icons/question-mark";

const NullComponent = (): null => null;

export const DEVICE_TYPE_ICON_MAP: Record<DeviceType, React.ReactNode> = {
  [DeviceType.COMPUTER /*    */]: <DeviceComputerIcon />,
  [DeviceType.MOBILE /*      */]: <DeviceMobileIcon />,
  [DeviceType.TABLET /*      */]: <DeviceTabletIcon />,
  [DeviceType.SMART_TV /*    */]: <DeviceTVIcon />,
  [DeviceType.CONSOLE /*     */]: <DeviceConsoleIcon />,
  [DeviceType.UNKNOWN /*     */]: <QuestionMarkIcon />,
  [DeviceType.UNRECOGNIZED /**/]: <NullComponent />,
  [DeviceType.UNSPECIFIED /* */]: <NullComponent />
};
