"use client";

import React from "react";

const ObserverErrorHandler = (): null => {
  React.useEffect(() => {
    // Virtuoso's resize observer can throw this error,
    // which is caught by DnD and aborts dragging
    const error_handler = (event: ErrorEvent): void => {
      if (
        [
          "ResizeObserver loop completed with undelivered notifications.",
          "ResizeObserver loop limit exceeded"
        ].includes(event.message)
      ) {
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener("error", error_handler);
    return () => window.removeEventListener("error", error_handler);
  }, []);

  return null;
};

export default ObserverErrorHandler;
