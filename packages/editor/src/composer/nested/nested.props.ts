import { EditorThemeClasses, Klass, LexicalEditor, LexicalNode } from "lexical";
import React from "react";

export interface NestedComposerProps {
  children: React.ReactNode;
  initialEditor: LexicalEditor;
  initialNodes?: ReadonlyArray<Klass<LexicalNode>>;
  initialTheme?: EditorThemeClasses;
  namespace?: string;
  skipCollabChecks?: true;
}
