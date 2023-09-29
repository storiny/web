"use client";

import { ExcludedProperties } from "../../collaboration/bindings";
import { use_yjs_read_only } from "../../hooks/use-yjs-read-only";

interface Props {
  excluded_properties?: ExcludedProperties;
  initial_doc: Uint8Array;
}

const ReadOnlyPlugin = (props: Props): null => {
  use_yjs_read_only(props);
  return null;
};

export default ReadOnlyPlugin;
