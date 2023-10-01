"use client";

import clsx from "clsx";
import { useSetAtom as use_set_atom } from "jotai";
import React from "react";

import { SymbolPickerContext } from "~/entities/symbol-picker";
import css from "~/theme/main.module.scss";

import { hovered_symbol_atom } from "../../atoms";
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
  const { on_symbol_select } = React.useContext(SymbolPickerContext) || {};
  const set_hovered = use_set_atom(hovered_symbol_atom);

  if (!symbol) {
    return <FakeSymbol />;
  }

  return (
    <button
      {...rest}
      aria-label={symbol.name}
      className={clsx(css["focusable"], styles.symbol, className)}
      onClick={(): void => on_symbol_select?.(symbol.value)}
      onMouseEnter={(): void => set_hovered(symbol.value)}
      onMouseLeave={(): void => set_hovered(null)}
      title={symbol.name}
    >
      {symbol.value}
    </button>
  );
};

export default React.memo(Symbol);
