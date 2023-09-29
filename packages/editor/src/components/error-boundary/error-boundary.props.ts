import React from "react";

export interface EditorErrorBoundaryProps {
  children: React.ReactNode;
  on_error: (error: Error) => void;
}
