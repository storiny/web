import CcByIcon from "@storiny/ui/src/icons/cc-by";
import CcNcIcon from "@storiny/ui/src/icons/cc-nc";
import CcNdIcon from "@storiny/ui/src/icons/cc-nd";
import CcSaIcon from "@storiny/ui/src/icons/cc-sa";
import CcZeroIcon from "@storiny/ui/src/icons/cc-zero";
import CopyrightIcon from "@storiny/ui/src/icons/copyright";
import React from "react";

import { StoryLicense } from "./story";

export const LICENSE_ICON_MAP: Record<StoryLicense, React.ReactNode> = {
  [StoryLicense.RESERVED /*   */]: <CopyrightIcon />,
  [StoryLicense.CC_ZERO /*    */]: <CcZeroIcon />,
  [StoryLicense.CC_BY /*      */]: <CcByIcon />,
  [StoryLicense.CC_BY_SA /*   */]: (
    <React.Fragment>
      <CcByIcon />
      <CcSaIcon />
    </React.Fragment>
  ),
  [StoryLicense.CC_BY_NC /*   */]: (
    <React.Fragment>
      <CcByIcon />
      <CcNcIcon />
    </React.Fragment>
  ),
  [StoryLicense.CC_BY_ND /*   */]: (
    <React.Fragment>
      <CcByIcon />
      <CcNdIcon />
    </React.Fragment>
  ),
  [StoryLicense.CC_BY_NC_SA /**/]: (
    <React.Fragment>
      <CcByIcon />
      <CcNcIcon />
      <CcSaIcon />
    </React.Fragment>
  ),
  [StoryLicense.CC_BY_NC_ND /**/]: (
    <React.Fragment>
      <CcByIcon />
      <CcNcIcon />
      <CcNdIcon />
    </React.Fragment>
  )
};

export const LICENSE_LABEL_MAP: Record<StoryLicense, string> = {
  [StoryLicense.RESERVED /*   */]: "Reserved",
  [StoryLicense.CC_ZERO /*    */]: "Public domain",
  [StoryLicense.CC_BY /*      */]: "CC BY",
  [StoryLicense.CC_BY_SA /*   */]: "CC BY-SA",
  [StoryLicense.CC_BY_NC /*   */]: "CC BY-NC",
  [StoryLicense.CC_BY_ND /*   */]: "CC BY-ND",
  [StoryLicense.CC_BY_NC_SA /**/]: "CC BY-NC-SA",
  [StoryLicense.CC_BY_NC_ND /**/]: "CC BY-NC-ND"
};
