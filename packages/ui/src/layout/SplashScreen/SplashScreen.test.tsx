import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import SplashScreen from "./SplashScreen";

describe("<SplashScreen />", () => {
  it("renders", () => {
    renderTestWithProvider(<SplashScreen forceMount />);
  });

  it("renders with children", () => {
    const { getByTestId } = renderTestWithProvider(
      <SplashScreen forceMount>
        <span data-testid={"child"} />
      </SplashScreen>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });
});
