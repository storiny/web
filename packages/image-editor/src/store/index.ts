"use client";

import { combineReducers, configureStore } from "@reduxjs/toolkit";

import { rootSlice } from "./features";

export const rootReducer = combineReducers({
  root: rootSlice.reducer
});

/**
 * Builds up the image editor store
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const setupEditorStore = () =>
  configureStore({
    reducer: rootReducer,
    devTools: !["production", "test"].includes(process.env.NODE_ENV || "")
  });

export const editorStore = setupEditorStore();

export * from "./features";
export * from "./hooks";

export type ImgEditorState = ReturnType<typeof rootReducer>;
export type ImgEditorStore = ReturnType<typeof setupEditorStore>;
export type ImgEditorDispatch = ImgEditorStore["dispatch"];
