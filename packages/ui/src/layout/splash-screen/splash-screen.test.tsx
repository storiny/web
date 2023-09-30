import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import SplashScreen from "./splash-screen";

describe("<SplashScreen />", () => {
  it("renders", () => {
    render_test_with_provider(<SplashScreen force_mount />);
  });

  it("renders with children", () => {
    const { getByTestId } = render_test_with_provider(
      <SplashScreen force_mount>
        <span data-testid={"child"} />
      </SplashScreen>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });
});
