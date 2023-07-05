import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import PageTitle from "./PageTitle";
import { PageTitleProps } from "./PageTitle.props";

describe("<PageTitle />", () => {
  it("renders", () => {
    renderTestWithProvider(<PageTitle />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<PageTitle />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders children", () => {
    const { getByTestId } = renderTestWithProvider(
      <PageTitle>
        <span data-testid={"child"} />
      </PageTitle>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("passes props to the component slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <PageTitle
        componentProps={
          {
            backButton: { "data-testid": "back-button" }
          } as PageTitleProps["componentProps"]
        }
      />
    );

    expect(getByTestId("back-button")).toBeInTheDocument();
  });
});
