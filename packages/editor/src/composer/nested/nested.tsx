import {
  createLexicalComposerContext,
  LexicalComposerContext,
  LexicalComposerContextType
} from "@lexical/react/LexicalComposerContext";
import { EditorThemeClasses, LexicalEditor } from "lexical";
import React from "react";

import { useCollaborationContext } from "../../plugins/collaboration/context";
import { NestedComposerProps } from "./nested.props";

const NestedComposer = ({
  initialEditor,
  children,
  initialNodes,
  initialTheme,
  skipCollabChecks,
  namespace
}: NestedComposerProps): React.ReactElement => {
  const wasCollabPreviouslyReadyRef = React.useRef(false);
  const parentContext = React.useContext(LexicalComposerContext);

  if (parentContext == null) {
    throw new Error("Cannot find parent context on a nested composer");
  }

  const [parentEditor, { getTheme: getParentTheme }] = parentContext;

  const composerContext: [LexicalEditor, LexicalComposerContextType] =
    React.useMemo(
      () => {
        const composerTheme: EditorThemeClasses | undefined =
          initialTheme || getParentTheme() || undefined;
        const context: LexicalComposerContextType =
          createLexicalComposerContext(parentContext, composerTheme);

        if (composerTheme !== undefined) {
          initialEditor._config.theme = composerTheme;
        }

        initialEditor._parentEditor = parentEditor;

        if (!initialNodes) {
          const parentNodes = (initialEditor._nodes = new Map(
            parentEditor._nodes
          ));

          for (const [type, entry] of parentNodes) {
            initialEditor._nodes.set(type, {
              klass: entry.klass,
              replace: entry.replace,
              replaceWithKlass: entry.replaceWithKlass,
              transforms: new Set()
            });
          }
        } else {
          for (const klass of initialNodes) {
            const type = klass.getType();
            initialEditor._nodes.set(type, {
              klass,
              replace: null,
              replaceWithKlass: null,
              transforms: new Set()
            });
          }
        }

        initialEditor._config.namespace =
          namespace || parentEditor._config.namespace;
        initialEditor._editable = parentEditor._editable;

        return [initialEditor, context];
      },

      // We only do this for init
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

  // If collaboration is enabled, make sure we don't render the children until the collaboration subdocument is ready
  const { isCollabActive, yjsDocMap } = useCollaborationContext({});
  const isCollabReady =
    skipCollabChecks ||
    wasCollabPreviouslyReadyRef.current ||
    yjsDocMap.has(initialEditor.getKey());

  React.useEffect(() => {
    if (isCollabReady) {
      wasCollabPreviouslyReadyRef.current = true;
    }
  }, [isCollabReady]);

  // Update `isEditable` state of nested editor in response to the same change on parent editor
  React.useEffect(
    () => parentEditor.registerEditableListener(initialEditor.setEditable),
    [initialEditor, parentEditor]
  );

  return (
    <LexicalComposerContext.Provider value={composerContext}>
      {!isCollabActive || isCollabReady ? children : null}
    </LexicalComposerContext.Provider>
  );
};

export default NestedComposer;
