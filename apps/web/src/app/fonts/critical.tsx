import React from "react";

import { cabinetGroteskFont } from "./families/cabinet-grotesk";
import { satoshiFont } from "./families/satoshi";
import { getFontFamiliesCss } from "./getFontFamiliesCss";

const fontFamilies: Record<string, string> = {
  satoshi: satoshiFont.style.fontFamily,
  "cabinet-grotesk": cabinetGroteskFont.style.fontFamily
};

const CriticalFonts = (): React.ReactElement => (
  <style
    dangerouslySetInnerHTML={{
      __html: `:root{${getFontFamiliesCss(fontFamilies)}}`
    }}
  />
);

export default CriticalFonts;
