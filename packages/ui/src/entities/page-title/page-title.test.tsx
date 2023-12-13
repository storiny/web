import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import PageTitle from "./page-title";
import { PageTitleProps } from "./page-title.props";

describe("<PageTitle />", () => {
  it("renders", () => {
    render_test_with_provider(<PageTitle />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<PageTitle />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders children", () => {
    const { getByTestId } = render_test_with_provider(
      <PageTitle>
        <span data-testid={"child"} />
      </PageTitle>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("passes props to the component slots", () => {
    const { getByTestId } = render_test_with_provider(
      <PageTitle
        component_props={
          {
            back_button: { "data-testid": "back-button" }
          } as PageTitleProps["component_props"]
        }
      />
    );

    expect(getByTestId("back-button")).toBeInTheDocument();
  });
});
