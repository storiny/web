import React from "react";

import { cabinetGroteskFont } from "./cabinet-grotesk";
import { satoshiFont } from "./satoshi";

const fontFamilies: Record<string, string> = {
  satoshi: satoshiFont.style.fontFamily,
  "cabinet-grotesk": cabinetGroteskFont.style.fontFamily,
};

const fontFamiliesCss = Object.keys(fontFamilies)
  .concat("") // Add a semicolon at the end
  .map((key) => (key ? `--font-${key}:${fontFamilies[key]}` : ""))
  .join(";");

const Fonts = (): React.ReactElement => (
  <style
    dangerouslySetInnerHTML={{
      __html: `:root{${fontFamiliesCss}}`,
    }}
  />
);

export default Fonts;
