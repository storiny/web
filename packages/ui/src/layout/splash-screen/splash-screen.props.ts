import React from "react";

export interface SplashScreenProps
  extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * Force the component to render.
   */
  force_mount?: boolean;
  /**
   * If `true`, hides the logo.
   */
  hide_logo?: boolean;
}
