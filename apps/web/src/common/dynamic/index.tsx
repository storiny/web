import { DynamicOptionsLoadingProps } from "next/dynamic";
import React from "react";

import SuspenseLoader from "~/common/suspense-loader";
import ErrorState from "~/entities/ErrorState";

/**
 * Dynamic component loader with error fallback
 * @param customLoader Custom loading component
 */
export const dynamicLoader =
  (
    customLoader?: (
      props: DynamicOptionsLoadingProps
    ) => React.ReactElement | null
  ) =>
  // eslint-disable-next-line react/display-name
  (props: DynamicOptionsLoadingProps): React.ReactElement | null =>
    props.error && !props.isLoading ? (
      <ErrorState autoSize retry={props.retry} />
    ) : customLoader ? (
      customLoader(props)
    ) : (
      <SuspenseLoader />
    );
