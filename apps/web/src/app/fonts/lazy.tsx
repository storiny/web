import React from "react";

import { FONT_ERODE } from "./families/erode";
import { FONT_LORA } from "./families/lora";
import { FONT_NUNITO } from "./families/nunito";
import { FONT_PLEX_MONO, FONT_PLEX_MONO_LIGATURES } from "./families/plex-mono";
import { FONT_RECIA } from "./families/recia";
import {
  FONT_SOURCE_CODE_PRO,
  FONT_SOURCE_CODE_PRO_LIGATURES
} from "./families/source-code-pro";
import { FONT_SOURCE_SERIF } from "./families/source-serif";
import { FONT_SYNONYM } from "./families/synonym";
import { FONT_VIRGIL } from "./families/virgil";
import { get_font_families_css } from "./get-font-families-css";

const FONT_FAMILIES: Record<string, string> = {
  nunito: FONT_NUNITO.style.fontFamily,
  synonym: FONT_SYNONYM.style.fontFamily,
  lora: FONT_LORA.style.fontFamily,
  erode: FONT_ERODE.style.fontFamily,
  recia: FONT_RECIA.style.fontFamily,
  virgil: FONT_VIRGIL.style.fontFamily,
  "source-serif": FONT_SOURCE_SERIF.style.fontFamily,
  "plex-mono": FONT_PLEX_MONO.style.fontFamily,
  "plex-mono-lig": FONT_PLEX_MONO_LIGATURES.style.fontFamily,
  "source-code-pro": FONT_SOURCE_CODE_PRO.style.fontFamily,
  "source-code-pro-lig": FONT_SOURCE_CODE_PRO_LIGATURES.style.fontFamily
};

const LazyFonts = (): React.ReactElement => (
  <style
    dangerouslySetInnerHTML={{
      __html: `:root{${get_font_families_css(FONT_FAMILIES)}}`
    }}
  />
);

export default LazyFonts;
