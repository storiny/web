import React from "react";

import Typography from "../../../../../../packages/ui/src/components/typography";

import { TypographyPropsWithoutColor } from "../../types";

const Heading = {
  H1: ({
    children,
    ...rest
  }: TypographyPropsWithoutColor): React.ReactElement => (
    <Typography {...rest} level={"h1"}>
      {children}
    </Typography>
  ),
  H2: ({
    children,
    ...rest
  }: TypographyPropsWithoutColor): React.ReactElement => (
    <Typography {...rest} level={"h2"}>
      {children}
    </Typography>
  ),
  H3: ({
    children,
    ...rest
  }: TypographyPropsWithoutColor): React.ReactElement => (
    <Typography {...rest} level={"h3"}>
      {children}
    </Typography>
  ),
  H4: ({
    children,
    ...rest
  }: TypographyPropsWithoutColor): React.ReactElement => (
    <Typography {...rest} level={"h4"}>
      {children}
    </Typography>
  )
};

export default Heading;
