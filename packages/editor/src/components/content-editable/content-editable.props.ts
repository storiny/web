import React from "react";

export interface EditorContentEditableProps
  extends React.ComponentPropsWithoutRef<"div"> {
  read_only?: boolean;
}
