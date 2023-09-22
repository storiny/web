import React from "react";

export interface EditorContentEditableProps
  extends React.ComponentPropsWithoutRef<"main"> {
  ariaActiveDescendant?: React.AriaAttributes["aria-activedescendant"];
  ariaAutoComplete?: React.AriaAttributes["aria-autocomplete"];
  ariaControls?: React.AriaAttributes["aria-controls"];
  ariaDescribedBy?: React.AriaAttributes["aria-describedby"];
  ariaExpanded?: React.AriaAttributes["aria-expanded"];
  ariaLabel?: React.AriaAttributes["aria-label"];
  ariaLabelledBy?: React.AriaAttributes["aria-labelledby"];
  ariaMultiline?: React.AriaAttributes["aria-multiline"];
  ariaOwns?: React.AriaAttributes["aria-owns"];
  ariaRequired?: React.AriaAttributes["aria-required"];
  autoCapitalize?: HTMLElement["autocapitalize"];
  editable?: boolean;
}
