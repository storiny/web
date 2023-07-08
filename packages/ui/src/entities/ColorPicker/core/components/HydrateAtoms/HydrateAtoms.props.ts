import React from "react";

export interface HydrateAtomsProps {
  children?: React.ReactNode;
  /**
   * Initial atom values
   */
  initialValues: any[];
}
