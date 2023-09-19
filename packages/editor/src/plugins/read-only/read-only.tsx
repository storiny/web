"use client";

import { ExcludedProperties } from "../../collaboration/bindings";
import { useYjsReadOnly } from "../../hooks/use-yjs-read-only";

interface Props {
  excludedProperties?: ExcludedProperties;
  initialDoc: Uint8Array;
}

const ReadOnlyPlugin = (props: Props): null => {
  useYjsReadOnly(props);
  return null;
};

export default ReadOnlyPlugin;
