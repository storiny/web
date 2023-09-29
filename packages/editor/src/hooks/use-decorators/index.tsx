"use client";

import { LexicalEditor } from "lexical";
import React from "react";
import {
  createPortal as create_portal,
  flushSync as flush_sync
} from "react-dom";

import { use_layout_effect } from "../use-layout-effect";

interface ErrorBoundaryProps {
  children: React.ReactElement;
  on_error: (error: Error) => void;
}

export type ErrorBoundaryType =
  | React.ComponentClass<ErrorBoundaryProps>
  | React.FC<ErrorBoundaryProps>;

/**
 * Hook for using editor decorators
 * @param editor Editor
 * @param ErrorBoundary Error boundary
 */
export const use_decorators = (
  editor: LexicalEditor,
  ErrorBoundary: ErrorBoundaryType
): Array<React.ReactElement> => {
  const [decorators, set_decorators] = React.useState<
    Record<string, React.ReactElement>
  >(() => editor.getDecorators<React.ReactElement>());

  // Subscribe to changes
  use_layout_effect(
    () =>
      editor.registerDecoratorListener<React.ReactElement>(
        (next_decorators) => {
          flush_sync(() => {
            set_decorators(next_decorators);
          });
        }
      ),
    [editor]
  );

  React.useEffect(() => {
    // If the content editable mounts before the subscription is added, then nothing will be rendered on initial pass. We can get around that by ensuring that we set the value.
    set_decorators(editor.getDecorators());
  }, [editor]);

  // Return decorators defined as React Portals
  return React.useMemo(() => {
    const decorated_portals = [];
    const decorator_keys = Object.keys(decorators);

    for (let i = 0; i < decorator_keys.length; i++) {
      const node_key = decorator_keys[i];
      const react_decorator = (
        <ErrorBoundary on_error={editor._onError}>
          <React.Suspense fallback={null}>
            {decorators[node_key]}
          </React.Suspense>
        </ErrorBoundary>
      );
      const element = editor.getElementByKey(node_key);

      if (element !== null) {
        decorated_portals.push(
          create_portal(react_decorator, element, node_key)
        );
      }
    }

    return decorated_portals;
  }, [ErrorBoundary, decorators, editor]);
};
