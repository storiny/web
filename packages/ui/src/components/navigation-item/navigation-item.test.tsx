import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import NavigationItem from "./navigation-item";
import { NavigationItemProps } from "./navigation-item.props";

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

    expect(await axe(container)).toHaveNoViolations();
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
      <NavigationItem end_decorator={<span data-testid={"end-decorator"} />}>
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
            end_decorator: { "data-testid": "end-decorator" }
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
