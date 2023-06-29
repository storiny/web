import React from "react";

import Typography from "~/components/Typography";

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
