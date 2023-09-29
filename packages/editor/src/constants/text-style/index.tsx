import React from "react";

import BulletedListIcon from "../../../../ui/src/icons/bulleted-list";
import HeadingIcon from "../../../../ui/src/icons/heading";
import NumberedListIcon from "../../../../ui/src/icons/numbered-list";
import ParagraphIcon from "../../../../ui/src/icons/paragraph";
import QuoteIcon from "../../../../ui/src/icons/quote";
import SubheadingIcon from "../../../../ui/src/icons/subheading";

export enum TextStyle {
  BULLETED_LIST /**/ = "bulleted-list",
  HEADING /*      */ = "heading",
  NUMBERED_LIST /**/ = "numbered-list",
  PARAGRAPH /*    */ = "paragraph",
  QUOTE /*        */ = "quote",
  SUBHEADING /*   */ = "subheading"
}

export const TEXT_STYLE_ICON_MAP: Record<TextStyle, React.ReactNode> = {
  [TextStyle.PARAGRAPH /*    */]: <ParagraphIcon />,
  [TextStyle.HEADING /*      */]: <HeadingIcon />,
  [TextStyle.SUBHEADING /*   */]: <SubheadingIcon />,
  [TextStyle.QUOTE /*        */]: <QuoteIcon />,
  [TextStyle.BULLETED_LIST /**/]: <BulletedListIcon />,
  [TextStyle.NUMBERED_LIST /**/]: <NumberedListIcon />
};

export const TEXT_STYLE_LABEL_MAP: Record<TextStyle, string> = {
  [TextStyle.PARAGRAPH /*    */]: "Paragraph",
  [TextStyle.HEADING /*      */]: "Heading",
  [TextStyle.SUBHEADING /*   */]: "Subheading",
  [TextStyle.QUOTE /*        */]: "Quote",
  [TextStyle.BULLETED_LIST /**/]: "Bulleted list",
  [TextStyle.NUMBERED_LIST /**/]: "Numbered list"
};

export const NODE_TEXT_STYLE_MAP: Record<string, TextStyle> = {
  h2 /*       */: TextStyle.HEADING,
  h3 /*       */: TextStyle.SUBHEADING,
  quote /*    */: TextStyle.QUOTE,
  paragraph /**/: TextStyle.PARAGRAPH
};
