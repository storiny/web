import css from "~/theme/main.module.scss";

import { LinkLevel, LinkScale } from "../link";
import { TypographyLevel, TypographyScale } from "../typography";

export const TYPOGRAPHY_SCALE_TO_CLASSNAME_MAP: Partial<
  Record<LinkScale | TypographyScale, string>
> = {
  body1 /*   */: css["t-body-1"],
  body2 /*   */: css["t-body-2"],
  body3 /*   */: css["t-body-3"],
  display1 /**/: css["t-display-1"],
  display2 /**/: css["t-display-2"],
  xl2 /*     */: css["t-head-xl2"],
  xl /*      */: css["t-head-xl"],
  lg /*      */: css["t-head-lg"],
  md /*      */: css["t-head-md"],
  sm /*      */: css["t-head-sm"],
  xs /*      */: css["t-head-xs"]
} as const;

export const TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP: Partial<
  Record<LinkLevel | TypographyLevel, string>
> = {
  body1 /*   */: css["t-body-1"],
  body2 /*   */: css["t-body-2"],
  body3 /*   */: css["t-body-3"],
  display1 /**/: css["t-display-1"],
  display2 /**/: css["t-display-2"],
  h1 /*      */: css["t-head-xl2"],
  h2 /*      */: css["t-head-xl"],
  h3 /*      */: css["t-head-lg"],
  h4 /*      */: css["t-head-md"],
  h5 /*      */: css["t-head-sm"],
  h6 /*      */: css["t-head-xs"],
  legible /* */: css["t-legible"],
  quote /*   */: css["t-quote"]
} as const;

export const TYPOGRAPHY_LEVEL_TO_ELEMENT_MAP: Record<TypographyLevel, string> =
  {
    h1 /*           */: "h1",
    h2 /*           */: "h2",
    h3 /*           */: "h3",
    h4 /*           */: "h4",
    h5 /*           */: "h5",
    h6 /*           */: "h6",
    display1 /*     */: "h1",
    display2 /*     */: "h2",
    body1 /*        */: "p",
    body2 /*        */: "p",
    body3 /*        */: "span",
    "inline-code" /**/: "code",
    legible /*      */: "p",
    mention /*      */: "p",
    tag /*          */: "p",
    quote /*        */: "blockquote"
  } as const;

export const TYPOGRAPHY_PREFIX_MAP: Partial<Record<TypographyLevel, string>> = {
  mention /**/: "@",
  tag /*    */: "#"
} as const;
