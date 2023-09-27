"use client";

import {
  TypedUseSelectorHook,
  useDispatch as use_dispatch,
  useSelector as use_selector
} from "react-redux";

import { AppDispatch, AppState } from "~/redux/store";

export const use_app_dispatch: () => AppDispatch = use_dispatch;
export const use_app_selector: TypedUseSelectorHook<AppState> = use_selector;
