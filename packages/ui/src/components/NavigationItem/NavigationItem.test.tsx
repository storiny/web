import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import NavigationItem from "./NavigationItem";
import { NavigationItemProps } from "./NavigationItem.props";

describe("<NavigationItem />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <NavigationItem>Test</NavigationItem>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <NavigationItem>Test</NavigationItem>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <NavigationItem as={"aside"} data-testid={"navigation-item"} />
    );
    expect(getByTestId("navigation-item").nodeName.toLowerCase()).toEqual(
      "aside"
    );
  });

  it("renders decorator", () => {
    const { getByTestId } = render_test_with_provider(
      <NavigationItem decorator={<span data-testid={"decorator"} />}>
        Test
      </NavigationItem>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("renders custom end decorator", () => {
    const { getByTestId } = render_test_with_provider(
      <NavigationItem endDecorator={<span data-testid={"end-decorator"} />}>
        Test
      </NavigationItem>
    );

    expect(getByTestId("end-decorator")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <NavigationItem
        decorator={<span />}
        slot_props={
          {
            decorator: { "data-testid": "decorator" },
            endDecorator: { "data-testid": "end-decorator" }
          } as NavigationItemProps["slot_props"]
        }
      >
        Test
      </NavigationItem>
    );

    ["decorator", "end-decorator"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
