import React from "react";

import BulletedListIcon from "~/icons/BulletedList";
import HeadingIcon from "~/icons/Heading";
import NumberedListIcon from "~/icons/NumberedList";
import ParagraphIcon from "~/icons/Paragraph";
import QuoteIcon from "~/icons/Quote";
import SubheadingIcon from "~/icons/Subheading";

export enum TextStyle {
  BULLETED_LIST /**/ = "bulleted-list",
  HEADING /*      */ = "heading",
  NUMBERED_LIST /**/ = "numbered-list",
  PARAGRAPH /*    */ = "paragraph",
  QUOTE /*        */ = "quote",
  SUBHEADING /*   */ = "subheading"
}

export const textStyleToIconMap: Record<TextStyle, React.ReactNode> = {
  [TextStyle.PARAGRAPH /*    */]: <ParagraphIcon />,
  [TextStyle.HEADING /*      */]: <HeadingIcon />,
  [TextStyle.SUBHEADING /*   */]: <SubheadingIcon />,
  [TextStyle.QUOTE /*        */]: <QuoteIcon />,
  [TextStyle.BULLETED_LIST /**/]: <BulletedListIcon />,
  [TextStyle.NUMBERED_LIST /**/]: <NumberedListIcon />
};

export const textStyleToLabelMap: Record<TextStyle, string> = {
  [TextStyle.PARAGRAPH /*    */]: "Paragraph",
  [TextStyle.HEADING /*      */]: "Heading",
  [TextStyle.SUBHEADING /*   */]: "Subheading",
  [TextStyle.QUOTE /*        */]: "Quote",
  [TextStyle.BULLETED_LIST /**/]: "Bulleted list",
  [TextStyle.NUMBERED_LIST /**/]: "Numbered list"
};
