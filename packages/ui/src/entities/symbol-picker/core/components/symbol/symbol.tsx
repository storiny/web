"use client";

import clsx from "clsx";
import { useSetAtom } from "jotai";
import React from "react";

import { SymbolPickerContext } from "~/entities/symbol-picker";

import { hoveredSymbolAtom } from "../../atoms";
import styles from "./symbol.module.scss";
import { SymbolProps } from "./symbol.props";

// Fake symbol

const FakeSymbol = React.memo(
  (props: React.ComponentPropsWithoutRef<"span">): React.ReactElement => {
    const { className, ...rest } = props;
    return (
      <span
        {...rest}
        aria-hidden
        className={clsx(styles["fake-symbol"], className)}
      />
    );
  }
);

FakeSymbol.displayName = "FakeSymbol";

const Symbol = (props: SymbolProps): React.ReactElement => {
  const { symbol, className, ...rest } = props;
  const { onSymbolSelect } = React.useContext(SymbolPickerContext) || {};
  const setHovered = useSetAtom(hoveredSymbolAtom);

  if (!symbol) {
    return <FakeSymbol />;
  }

  return (
    <button
      {...rest}
      aria-label={symbol.name}
      className={clsx("focusable", styles.symbol, className)}
      onClick={(): void => onSymbolSelect?.(symbol.value)}
      onMouseEnter={(): void => setHovered(symbol.value)}
      onMouseLeave={(): void => setHovered(null)}
      title={symbol.name}
    >
      {symbol.value}
    </button>
  );
};

export default React.memo(Symbol);
