import React from "react";

import AlignCenterIcon from "~/icons/AlignCenter";
import AlignJustifyIcon from "~/icons/AlignJustify";
import AlignLeftIcon from "~/icons/AlignLeft";
import AlignRightIcon from "~/icons/AlignRight";

export enum Alignment {
  CENTER /* */ = "center",
  JUSTIFY /**/ = "justify",
  LEFT /*   */ = "left",
  RIGHT /*  */ = "right"
}

export const alignmentToIconMap: Record<Alignment, React.ReactNode> = {
  [Alignment.LEFT /*   */]: <AlignLeftIcon />,
  [Alignment.CENTER /* */]: <AlignCenterIcon />,
  [Alignment.RIGHT /*  */]: <AlignRightIcon />,
  [Alignment.JUSTIFY /**/]: <AlignJustifyIcon />
};
