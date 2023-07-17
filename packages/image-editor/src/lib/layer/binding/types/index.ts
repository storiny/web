import { BindableLayer, LinearLayer, NonDeleted } from "../../../../types";

export type SuggestedBinding =
  | NonDeleted<BindableLayer>
  | SuggestedPointBinding;

export type SuggestedPointBinding = [
  NonDeleted<LinearLayer>,
  "start" | "end" | "both",
  NonDeleted<BindableLayer>
];
