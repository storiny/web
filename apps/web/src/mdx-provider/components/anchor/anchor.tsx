import React from "react";

import Link, {
  LinkProps
} from "../../../../../../packages/ui/src/components/link";

const Anchor = ({ children, ...rest }: LinkProps): React.ReactElement => (
  <Link {...rest} underline={"always"}>
    {children}
  </Link>
);

export default Anchor;
