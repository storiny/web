export const EDITOR_SHORTCUTS = {
  // Menu
  importFile /*   */: { key: "o", ctrl: true },
  // Text style
  bold /*         */: { key: "b", ctrl: true },
  italic /*       */: { key: "i", ctrl: true },
  underline /*    */: { key: "u", ctrl: true },
  strikethrough /**/: { key: "x", ctrl: true, shift: true },
  link /*         */: { key: "k", ctrl: true },
  code /*         */: { key: "j", ctrl: true },
  superscript /*  */: { key: ";", ctrl: true },
  subscript /*    */: { key: "'", ctrl: true },
  // Text nodes
  paragraph /*    */: { key: "p", ctrl: true, alt: true },
  heading /*      */: { key: "h", ctrl: true },
  subheading /*   */: { key: "h", ctrl: true, shift: true },
  quote /*        */: { key: "q", ctrl: true, shift: true },
  bulletedList /* */: { key: "8", ctrl: true, shift: true },
  numberedList /* */: { key: "7", ctrl: true, shift: true },
  // Alignment
  leftAlign /*    */: { key: "l", ctrl: true, alt: true },
  centerAlign /*  */: { key: "t", ctrl: true, alt: true },
  rightAlign /*   */: { key: "r", ctrl: true, alt: true },
  justifyAlign /* */: { key: "j", ctrl: true, alt: true },
  indent /*       */: { key: "[", ctrl: true },
  outdent /*      */: { key: "]", ctrl: true },
  // History
  undo /*         */: { key: "z", ctrl: true },
  redo /*         */: { key: "y", ctrl: true },
  redoAlt /*      */: { key: "z", ctrl: true, shift: true },
  // Layout
  sidebars /*     */: { key: "\\", ctrl: true }
} as const;
