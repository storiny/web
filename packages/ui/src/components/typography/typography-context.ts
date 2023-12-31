"use client";

import React from "react";

/**
 * For creating nested Typography to inherit the level (unless an explicit
 * `level` prop is provided) and change the HTML tag to `span` (unless an
 * explicit `component` prop is provided).
 */
export const TypographyNestedContext = React.createContext<boolean>(false);
