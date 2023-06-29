import React from "react";

import { NoSsrProps } from "./NoSsr.props";

const useEnhancedEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const NoSsr = (props: NoSsrProps): React.ReactElement => {
  const { children, fallback = null, disabled } = props;
  const [mountedState, setMountedState] = React.useState<boolean>(false);

  useEnhancedEffect(() => {
    setMountedState(true);
  }, []);

  // Fragment is required here to force react-docgen to recognise NoSsr as a component.
  return (
    <React.Fragment>
      {mountedState || disabled ? children : fallback}
    </React.Fragment>
  );
};

export default NoSsr;
