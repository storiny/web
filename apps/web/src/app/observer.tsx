"use client";

import React from "react";

const ObserverErrorHandler = (): null => {
  React.useEffect(() => {
    // Virtuoso's resize observer can throw this error,
    // which is caught by DnD and aborts dragging
    const errorHandler = (event: ErrorEvent): void => {
      if (
        [
          "ResizeObserver loop completed with undelivered notifications.",
          "ResizeObserver loop limit exceeded"
        ].includes(event.message)
      ) {
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener("error", errorHandler);
    return () => window.removeEventListener("error", errorHandler);
  }, []);

  return null;
};

export default ObserverErrorHandler;
