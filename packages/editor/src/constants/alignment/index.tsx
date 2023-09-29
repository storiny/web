import React from "react";

import AlignCenterIcon from "../../../../ui/src/icons/align-center";
import AlignJustifyIcon from "../../../../ui/src/icons/align-justify";
import AlignLeftIcon from "../../../../ui/src/icons/align-left";
import AlignRightIcon from "../../../../ui/src/icons/align-right";

export enum Alignment {
  CENTER /* */ = "center",
  JUSTIFY /**/ = "justify",
  LEFT /*   */ = "left",
  RIGHT /*  */ = "right"
}

export const ALIGNMENT_ICON_MAP: Record<Alignment, React.ReactNode> = {
  [Alignment.LEFT /*   */]: <AlignLeftIcon />,
  [Alignment.CENTER /* */]: <AlignCenterIcon />,
  [Alignment.RIGHT /*  */]: <AlignRightIcon />,
  [Alignment.JUSTIFY /**/]: <AlignJustifyIcon />
};
