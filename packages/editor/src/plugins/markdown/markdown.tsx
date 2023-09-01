import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import React from "react";

import { MD_TRANSFORMERS } from "./transformers";

const MarkdownPlugin = (): React.ReactElement => (
  <MarkdownShortcutPlugin transformers={MD_TRANSFORMERS} />
);

export default MarkdownPlugin;
