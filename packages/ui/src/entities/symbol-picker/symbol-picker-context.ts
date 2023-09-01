"use client";

import React from "react";

import { SymbolPickerProps } from "./symbol-picker.props";

export const SymbolPickerContext = React.createContext<
  Pick<SymbolPickerProps, "onSymbolSelect">
>({});
