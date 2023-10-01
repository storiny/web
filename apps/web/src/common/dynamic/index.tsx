import { DynamicOptionsLoadingProps } from "next/dynamic";
import React from "react";

import SuspenseLoader from "~/common/suspense-loader";
import ErrorState from "~/entities/error-state";

/**
 * Dynamic component loader with error fallback
 * @param custom_loader Custom loading component
 */
export const dynamic_loader =
  (
    custom_loader?: (
      props: DynamicOptionsLoadingProps
    ) => React.ReactElement | null
  ) =>
  // eslint-disable-next-line react/display-name
  (props: DynamicOptionsLoadingProps): React.ReactElement | null =>
    props.error && !props.isLoading ? (
      <ErrorState auto_size retry={props.retry} />
    ) : custom_loader ? (
      custom_loader(props)
    ) : (
      <SuspenseLoader />
    );
