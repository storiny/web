import React from "react";

import { erodeFont } from "./families/erode";
import { loraFont } from "./families/lora";
import { merriweatherFont } from "./families/merriweather";
import { nunitoFont } from "./families/nunito";
import { plexMonoFont, plexMonoLigaturesFont } from "./families/plex-mono";
import { reciaFont } from "./families/recia";
import {
  sourceCodeProFont,
  sourceCodeProLigaturesFont
} from "./families/source-code-pro";
import { synonymFont } from "./families/synonym";
import { getFontFamiliesCss } from "./getFontFamiliesCss";

const fontFamilies: Record<string, string> = {
  nunito: nunitoFont.style.fontFamily,
  synonym: synonymFont.style.fontFamily,
  lora: loraFont.style.fontFamily,
  erode: erodeFont.style.fontFamily,
  recia: reciaFont.style.fontFamily,
  merriweather: merriweatherFont.style.fontFamily,
  "plex-mono": plexMonoFont.style.fontFamily,
  "plex-mono-lig": plexMonoLigaturesFont.style.fontFamily,
  "source-code-pro": sourceCodeProFont.style.fontFamily,
  "source-code-pro-lig": sourceCodeProLigaturesFont.style.fontFamily
};

const LazyFonts = (): React.ReactElement => (
  <style
    dangerouslySetInnerHTML={{
      __html: `:root{${getFontFamiliesCss(fontFamilies)}}`
    }}
  />
);

export default LazyFonts;
