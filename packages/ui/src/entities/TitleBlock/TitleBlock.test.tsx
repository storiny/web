import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import TitleBlock from "./TitleBlock";
import { TitleBlockProps } from "./TitleBlock.props";

describe("<TitleBlock />", () => {
  it("renders", () => {
    render_test_with_provider(<TitleBlock title={"test"}>Content</TitleBlock>);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <TitleBlock title={"test"}>Content</TitleBlock>
    );
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders children", () => {
    const { getByTestId } = render_test_with_provider(
      <TitleBlock title={"test"}>
        <span data-testid={"child"} />
      </TitleBlock>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("passes props to the component slots", () => {
    const { getByTestId } = render_test_with_provider(
      <TitleBlock
        component_props={
          {
            title: { "data-testid": "title" },
            content: { "data-testid": "content" }
          } as TitleBlockProps["component_props"]
        }
        title={"test"}
      >
        Content
      </TitleBlock>
    );

    ["title", "content"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
