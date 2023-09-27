import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import SplashScreen from "./SplashScreen";

describe("<SplashScreen />", () => {
  it("renders", () => {
    render_test_with_provider(<SplashScreen forceMount />);
  });

  it("renders with children", () => {
    const { getByTestId } = render_test_with_provider(
      <SplashScreen forceMount>
        <span data-testid={"child"} />
      </SplashScreen>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });
});
