import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import NavigationItem from "./NavigationItem";
import { NavigationItemProps } from "./NavigationItem.props";

describe("<NavigationItem />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <NavigationItem>Test</NavigationItem>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <NavigationItem>Test</NavigationItem>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders decorator", () => {
    const { getByTestId } = renderTestWithProvider(
      <NavigationItem decorator={<span data-testid={"decorator"} />}>
        Test
      </NavigationItem>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <NavigationItem
        decorator={<span />}
        slotProps={
          {
            decorator: { "data-testid": "decorator" }
          } as NavigationItemProps["slotProps"]
        }
      >
        Test
      </NavigationItem>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });
});
