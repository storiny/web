import React from "react";

import { FONT_CABINET_GROTESK } from "./families/cabinet-grotesk";
import { FONT_SATOSHI } from "./families/satoshi";
import { get_font_families_css } from "./get-font-families-css";

const FONT_FAMILIES: Record<string, string> = {
  satoshi: FONT_SATOSHI.style.fontFamily,
  "cabinet-grotesk": FONT_CABINET_GROTESK.style.fontFamily
};

const CriticalFonts = (): React.ReactElement => (
  <style
    dangerouslySetInnerHTML={{
      __html: `:root{${get_font_families_css(FONT_FAMILIES)}}`
    }}
  />
);

export default CriticalFonts;
