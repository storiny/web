"use client";

import React from "react";

// Consumed by form controls elements
export const FormContext = React.createContext<{
  disabled?: boolean;
}>({});
