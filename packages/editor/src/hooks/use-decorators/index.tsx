import { LexicalEditor } from "lexical";
import React from "react";
import { createPortal, flushSync } from "react-dom";

import { useLayoutEffect } from "../../utils/use-layout-effect";

interface ErrorBoundaryProps {
  children: React.ReactElement;
  onError: (error: Error) => void;
}

export type ErrorBoundaryType =
  | React.ComponentClass<ErrorBoundaryProps>
  | React.FC<ErrorBoundaryProps>;

/**
 * Hook for using editor decorators
 * @param editor Editor
 * @param ErrorBoundary Error boundary
 */
export const useDecorators = (
  editor: LexicalEditor,
  ErrorBoundary: ErrorBoundaryType
): Array<React.ReactElement> => {
  const [decorators, setDecorators] = React.useState<
    Record<string, React.ReactElement>
  >(() => editor.getDecorators<React.ReactElement>());

  // Subscribe to changes
  useLayoutEffect(
    () =>
      editor.registerDecoratorListener<React.ReactElement>((nextDecorators) => {
        flushSync(() => {
          setDecorators(nextDecorators);
        });
      }),
    [editor]
  );

  React.useEffect(() => {
    // If the content editable mounts before the subscription is added, then
    // nothing will be rendered on initial pass. We can get around that by
    // ensuring that we set the value.
    setDecorators(editor.getDecorators());
  }, [editor]);

  // Return decorators defined as React Portals
  return React.useMemo(() => {
    const decoratedPortals = [];
    const decoratorKeys = Object.keys(decorators);

    for (let i = 0; i < decoratorKeys.length; i++) {
      const nodeKey = decoratorKeys[i];
      const reactDecorator = (
        <ErrorBoundary onError={(e): void => editor._onError(e)}>
          <React.Suspense fallback={null}>{decorators[nodeKey]}</React.Suspense>
        </ErrorBoundary>
      );
      const element = editor.getElementByKey(nodeKey);

      if (element !== null) {
        decoratedPortals.push(createPortal(reactDecorator, element, nodeKey));
      }
    }

    return decoratedPortals;
  }, [ErrorBoundary, decorators, editor]);
};
