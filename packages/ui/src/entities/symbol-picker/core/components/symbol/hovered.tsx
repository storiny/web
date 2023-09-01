"use client";

import { useAtomValue } from "jotai";
import React from "react";

import HandClickIcon from "~/icons/HandClick";

import { hoveredSymbolAtom } from "../../atoms";

const HoveredSymbol = (): React.ReactElement => {
  const hoveredSymbol = useAtomValue(hoveredSymbolAtom);

  if (!hoveredSymbol) {
    return <HandClickIcon />;
  }

  return <span>{hoveredSymbol}</span>;
};

export default HoveredSymbol;
