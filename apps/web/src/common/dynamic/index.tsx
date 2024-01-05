import { DynamicOptionsLoadingProps } from "next/dynamic";
import React from "react";

import SuspenseLoader, { SuspenseLoaderProps } from "~/common/suspense-loader";
import ErrorState, { ErrorStateProps } from "~/entities/error-state";

/**
 * Dynamic component loader with error fallback
 * @param custom_loader Custom loading component
 * @param error_state_props Optional props for the error state component
 * @param suspense_loader_props Optional props for the suspense loader component
 */
export const dynamic_loader =
  (
    custom_loader?: (
      props: DynamicOptionsLoadingProps
    ) => React.ReactElement | null,
    {
      error_state_props,
      suspense_loader_props
    }: {
      error_state_props?: ErrorStateProps;
      suspense_loader_props?: SuspenseLoaderProps;
    } = {}
  ) =>
  // eslint-disable-next-line react/display-name
  (props: DynamicOptionsLoadingProps): React.ReactElement | null =>
    props.error && !props.isLoading ? (
      <ErrorState auto_size {...error_state_props} retry={props.retry} />
    ) : custom_loader ? (
      custom_loader(props)
    ) : (
      <SuspenseLoader {...suspense_loader_props} />
    );
