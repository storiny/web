import { Queries, queries } from "@testing-library/dom";
import { RenderOptions, RenderResult } from "@testing-library/react";
import * as testing_library from "@testing-library/react";
import {
  renderHook,
  RenderHookOptions,
  RenderHookResult
} from "@testing-library/react";
import React from "react";
import AppStateProvider from "src/redux/components/root-provider";

import { logged_in_state } from "~/redux/mock";
import { initial_state } from "~/redux/state";
import { AppStore, setup_store } from "~/redux/store";

/**
 * Extends the default options for render from RTL, as well
 * as allows to specify other things such as state init callback and store
 */
interface ExtendedRenderOptions<
  Q extends Queries = typeof queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container
> extends Omit<RenderOptions<Q, Container, BaseElement>, "queries"> {
  ignore_primitive_providers?: boolean;
  loading?: boolean;
  logged_in?: boolean;
  store?: AppStore;
}

/**
 * Extended version of RTL's `render` with state provider
 * @param ui The UI to render
 * @param logged_in Logged in flag
 * @param loading Loading flag
 * @param store Optional predefined store
 * @param ignore_primitive_providers Whether or not to wrap the UI with primitve providers
 * @param render_options Options passed to RTL's `render` function
 */
export const render_test_with_provider = <
  Q extends Queries = typeof queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container
>(
  ui: React.ReactElement,
  {
    logged_in,
    loading,
    store = setup_store(
      logged_in || loading
        ? logged_in_state(loading ? "loading" : "complete")
        : initial_state,
      true
    ),
    // Ignore providers as the primitives are explicitly wrapped in tests.
    ignore_primitive_providers = true,
    ...render_options
  }: ExtendedRenderOptions<Q, Container, BaseElement> = {}
): { store: AppStore; wrapper: React.FC } & RenderResult<
  Q,
  Container,
  BaseElement
> => {
  const Wrapper = ({
    children
  }: React.PropsWithChildren<object>): React.ReactElement => (
    <AppStateProvider
      ignore_primitive_providers={ignore_primitive_providers}
      store={store}
    >
      {children}
    </AppStateProvider>
  );

  return {
    store,
    wrapper: Wrapper,
    ...testing_library.render<Q, Container, BaseElement>(ui, {
      wrapper: Wrapper,
      ...render_options
    })
  };
};

/**
 * Extended version of RTL's `renderHook` with state provider
 * @param render The render function for the hook
 * @param options Render hook options
 * @param renderer_options Extended rendering options for manipulating the store
 */
export const render_hook_with_provider = <
  Result,
  Props,
  Q extends Queries = typeof queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container
>(
  render: (initial_props: Props) => Result,
  options?: RenderHookOptions<Props, Q, Container, BaseElement>,
  renderer_options?: ExtendedRenderOptions
): RenderHookResult<Result, Props> => {
  const { wrapper } = render_test_with_provider(<span />, renderer_options);
  return renderHook(render, { ...options, wrapper });
};
