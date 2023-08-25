"use client";

import React from "react";

export const LayersContext = React.createContext<{
  layerCount: number;
  panelHeight: number;
}>({
  layerCount: 0,
  panelHeight: 0
});
