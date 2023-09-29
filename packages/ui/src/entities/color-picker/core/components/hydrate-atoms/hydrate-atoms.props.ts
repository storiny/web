import React from "react";

export interface HydrateAtomsProps {
  children?: React.ReactNode;
  /**
   * Initial atom values
   */
  initial_values: any[];
}
