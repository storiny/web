import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import TitleBlock from "./TitleBlock";
import { TitleBlockProps } from "./TitleBlock.props";

describe("<TitleBlock />", () => {
  it("renders", () => {
    renderTestWithProvider(<TitleBlock title={"test"}>Content</TitleBlock>);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <TitleBlock title={"test"}>Content</TitleBlock>
    );
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders children", () => {
    const { getByTestId } = renderTestWithProvider(
      <TitleBlock title={"test"}>
        <span data-testid={"child"} />
      </TitleBlock>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("passes props to the component slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <TitleBlock
        componentProps={
          {
            title: { "data-testid": "title" },
            content: { "data-testid": "content" }
          } as TitleBlockProps["componentProps"]
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
