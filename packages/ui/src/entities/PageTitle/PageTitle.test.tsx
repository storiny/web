import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import PageTitle from "./PageTitle";
import { PageTitleProps } from "./PageTitle.props";

describe("<PageTitle />", () => {
  it("renders", () => {
    render_test_with_provider(<PageTitle />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<PageTitle />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
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
            backButton: { "data-testid": "back-button" }
          } as PageTitleProps["component_props"]
        }
      />
    );

    expect(getByTestId("back-button")).toBeInTheDocument();
  });
});
