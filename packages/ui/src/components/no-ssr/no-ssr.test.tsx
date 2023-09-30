import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import NoSsr from "./no-ssr";

describe("<NoSsr />", () => {
  it("renders children", () => {
    const { getByTestId } = render_test_with_provider(
      <NoSsr>
        <span data-testid={"child"} />
      </NoSsr>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });
});
