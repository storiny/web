import { LinkLevel } from "../Link";
import { LinkScale } from "../Link";
import { TypographyLevel } from "../Typography";
import { TypographyScale } from "../Typography";

export const scaleToClassNameMap: Partial<
  Record<LinkScale | TypographyScale, string>
> = {
  body1 /*   */: "t-body-1",
  body2 /*   */: "t-body-2",
  body3 /*   */: "t-body-3",
  display1 /**/: "t-display-1",
  display2 /**/: "t-display-2",
  xl2 /*     */: "t-head-xl2",
  xl /*      */: "t-head-xl",
  lg /*      */: "t-head-lg",
  md /*      */: "t-head-md",
  sm /*      */: "t-head-sm",
  xs /*      */: "t-head-xs"
} as const;

export const levelToClassNameMap: Partial<
  Record<LinkLevel | TypographyLevel, string>
> = {
  body1 /*   */: "t-body-1",
  body2 /*   */: "t-body-2",
  body3 /*   */: "t-body-3",
  display1 /**/: "t-display-1",
  display2 /**/: "t-display-2",
  h1 /*      */: "t-head-xl2",
  h2 /*      */: "t-head-xl",
  h3 /*      */: "t-head-lg",
  h4 /*      */: "t-head-md",
  h5 /*      */: "t-head-sm",
  h6 /*      */: "t-head-xs",
  legible /* */: "t-legible",
  quote /*   */: "t-quote"
} as const;

export const defaultLevelToNativeElementMap: Record<TypographyLevel, string> = {
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

export const prefixMap: Partial<Record<TypographyLevel, string>> = {
  mention /**/: "@",
  tag /*    */: "#"
};
