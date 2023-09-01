import {
  createEmptyHistoryState,
  HistoryState
} from "@lexical/react/LexicalHistoryPlugin";
import React from "react";

interface ContextShape {
  historyState?: HistoryState;
}

const HistoryContext: React.Context<ContextShape> = React.createContext({});

const SharedHistoryContext = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const historyContext = React.useMemo(
    () => ({ historyState: createEmptyHistoryState() }),
    []
  );
  return (
    <HistoryContext.Provider value={historyContext}>
      {children}
    </HistoryContext.Provider>
  );
};

export default SharedHistoryContext;

/**
 * Hook for using shared history context
 */
export const useSharedHistoryContext = (): ContextShape =>
  React.useContext(HistoryContext);
