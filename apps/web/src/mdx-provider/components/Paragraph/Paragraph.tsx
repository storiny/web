import React from "react";

import Typography from "../../../../../../packages/ui/src/components/typography";

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
