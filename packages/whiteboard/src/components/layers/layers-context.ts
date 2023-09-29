"use client";

import React from "react";

export const LayersContext = React.createContext<{
  layer_count: number;
  panel_height: number;
}>({
  layer_count: 0,
  panel_height: 0
});
