import React from "react";

import Typography from "../../../../../../packages/ui/src/components/typography";

import { TypographyPropsWithoutColor } from "../../types";

const Code = ({
  children,
  ...rest
}: TypographyPropsWithoutColor): React.ReactElement => (
  <Typography {...rest} level={"inline-code"}>
    {children}
  </Typography>
);

export default Code;
