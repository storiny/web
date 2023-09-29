"use client";

import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import HandClickIcon from "src/icons/hand-click";

import { hovered_symbol_atom } from "../../atoms";

const HoveredSymbol = (): React.ReactElement => {
  const hovered_symbol = use_atom_value(hovered_symbol_atom);

  if (!hovered_symbol) {
    return <HandClickIcon />;
  }

  return <span>{hovered_symbol}</span>;
};

export default HoveredSymbol;
