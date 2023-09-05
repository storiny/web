import React from "react";

export interface EditorErrorBoundaryProps {
  children: React.ReactNode;
  onError: (error: Error) => void;
}
