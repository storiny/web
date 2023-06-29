import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import NoSsr from "./NoSsr";

describe("<NoSsr />", () => {
  it("renders children", () => {
    const { getByTestId } = renderTestWithProvider(
      <NoSsr>
        <span data-testid={"child"} />
      </NoSsr>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });
});
