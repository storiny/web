import React from "react";

export interface EditorContentEditableProps
  extends React.ComponentPropsWithoutRef<"section"> {
  editable?: boolean;
}
