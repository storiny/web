import React from "react";

import { NoSsrProps } from "./no-ssr.props";

const use_enhanced_effect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const NoSsr = (props: NoSsrProps): React.ReactElement => {
  const { children, fallback = null, disabled } = props;
  const [mounted_state, set_mounted_state] = React.useState<boolean>(false);

  use_enhanced_effect(() => {
    set_mounted_state(true);
  }, []);

  // Fragment is required here to force react-docgen to recognise NoSsr as a
  // component.
  return (
    <React.Fragment>
      {mounted_state || disabled ? children : fallback}
    </React.Fragment>
  );
};

export default NoSsr;
