import React from "react";

import { StatusProps } from "~/entities/status/status.props";

type StatusContextValue = Omit<StatusProps, "modal_props" | "disable_modal"> & {
  is_editable: boolean;
};

export const StatusContext = React.createContext<StatusContextValue>(
  {} as StatusContextValue
);
