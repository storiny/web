"use client";

import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import { ImgEditorDispatch, ImgEditorState } from "../index";

export const useEditorDispatch: () => ImgEditorDispatch = useDispatch;
export const useEditorSelector: TypedUseSelectorHook<ImgEditorState> =
  useSelector;
