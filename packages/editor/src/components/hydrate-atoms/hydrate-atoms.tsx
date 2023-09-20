import { ExtractAtomValue, WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/react/utils";
import React from "react";

type AnyWritableAtom = WritableAtom<unknown, any[], any>;
type AtomTuple<A = AnyWritableAtom, V = ExtractAtomValue<A>> = readonly [A, V];

const HydrateAtoms = ({
  values,
  children
}: {
  children: React.ReactElement;
  values: AtomTuple<AnyWritableAtom, unknown>[];
}): React.ReactElement => {
  useHydrateAtoms(values);
  return children;
};

export default HydrateAtoms;
