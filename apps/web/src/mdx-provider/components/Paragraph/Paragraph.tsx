import React from "react";

import Typography from "~/components/Typography";

import { TypographyPropsWithoutColor } from "../../types";

const Paragraph = ({
  children,
  ...rest
}: TypographyPropsWithoutColor): React.ReactElement => (
  <Typography {...rest} level={"legible"}>
    {children}
  </Typography>
);

export default Paragraph;
