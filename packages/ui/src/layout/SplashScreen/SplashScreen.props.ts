import React from "react";

export interface SplashScreenProps
  extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * Force the component to render.
   */
  forceMount?: boolean;
}
