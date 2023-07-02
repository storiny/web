import { Queries, queries } from "@testing-library/dom";
import type { RenderOptions } from "@testing-library/react";
import * as testingLibrary from "@testing-library/react";
import {
  renderHook,
  RenderHookOptions,
  RenderHookResult
} from "@testing-library/react";
import React from "react";

import AppStateProvider from "~/redux/components/RootProvider";
import { loggedInState } from "~/redux/mock";
import { initialState } from "~/redux/state";
import { AppStore, setupStore } from "~/redux/store";

/**
 * Extends the default options for render from RTL, as well
 * as allows to specify other things such as state init callback and store
 */
interface ExtendedRenderOptions extends Omit<RenderOptions, "queries"> {
  ignorePrimitiveProviders?: boolean;
  loading?: boolean;
  loggedIn?: boolean;
  store?: AppStore;
}

/**
 * Extended version of RTL's `render` with state provider
 * @param ui The UI to render
 * @param loggedIn Logged in flag
 * @param loading Loading flag
 * @param ignorePrimitiveProviders Whether or not to wrap the UI with primitve providers
 * @param renderOptions Options passed to RTL's `render` function
 */
export const renderTestWithProvider = (
  ui: React.ReactElement,
  {
    loggedIn,
    loading,
    // Ignore providers as the primitives are explicitly wrapped in tests.
    ignorePrimitiveProviders = true,
    ...renderOptions
  }: ExtendedRenderOptions = {}
) => {
  const store = setupStore(
    loggedIn || loading
      ? loggedInState(loading ? "loading" : "complete")
      : initialState,
    true
  );

  const Wrapper = ({
    children
  }: React.PropsWithChildren<{}>): React.ReactElement => (
    <AppStateProvider
      ignorePrimitiveProviders={ignorePrimitiveProviders}
      store={store}
    >
      {children}
    </AppStateProvider>
  );

  return {
    store,
    wrapper: Wrapper,
    ...testingLibrary.render(ui, { wrapper: Wrapper, ...renderOptions })
  };
};

/**
 * Extended version of RTL's `renderHook` with state provider
 * @param render The render function for the hook
 * @param options Render hook options
 * @param rendererOptions Extended rendering options for manipulating the store
 */
export const renderHookWithProvider = <
  Result,
  Props,
  Q extends Queries = typeof queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container
>(
  render: (initialProps: Props) => Result,
  options?: RenderHookOptions<Props, Q, Container, BaseElement>,
  rendererOptions?: ExtendedRenderOptions
): RenderHookResult<Result, Props> => {
  const { wrapper } = renderTestWithProvider(<span />, rendererOptions);
  return renderHook(render, { ...options, wrapper });
};
