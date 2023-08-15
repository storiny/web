import React from "react";

export interface SettingsAlertProps
  extends React.ComponentPropsWithoutRef<"div"> {
  onDismiss?: () => void;
}
