import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Masonry from "./Masonry";
import { MasonryProps } from "./Masonry.props";

describe("<Masonry />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <Masonry<{ name: string }>
        items={[{ name: "test" }]}
        renderItem={({ data }): React.ReactElement => <span>{data.name}</span>}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Masonry<{ name: string }>
        items={[{ name: "test" }]}
        renderItem={({ data }): React.ReactElement => <span>{data.name}</span>}
      />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders item", () => {
    const { getByTestId } = renderTestWithProvider(
      <Masonry<{ name: string }>
        items={[{ name: "test" }]}
        renderItem={({ data }): React.ReactElement => (
          <span data-testid={"item"}>{data.name}</span>
        )}
      />
    );

    expect(getByTestId("item")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId, queryAllByTestId } = renderTestWithProvider(
      <Masonry<{ name: string }>
        items={[{ name: "test" }]}
        renderItem={({ data }): React.ReactElement => <span>{data.name}</span>}
        slotProps={
          {
            item: { "data-testid": "item" },
            container: { "data-testid": "container" }
          } as MasonryProps<{ name: string }>["slotProps"]
        }
      />
    );

    expect(getByTestId("item")).toBeInTheDocument();
    expect(queryAllByTestId("container")).toBeNonEmptyArray();
  });
});
