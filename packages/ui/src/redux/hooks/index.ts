"use client";

import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import { AppDispatch, AppState } from "~/redux/store";

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;
