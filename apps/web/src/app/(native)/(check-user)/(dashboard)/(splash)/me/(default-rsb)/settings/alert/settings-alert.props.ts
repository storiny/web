import React from "react";

export interface SettingsAlertProps
  extends React.ComponentPropsWithoutRef<"div"> {
  on_dismiss?: () => void;
}
