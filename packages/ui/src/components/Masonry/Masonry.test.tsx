import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Masonry from "./Masonry";
import { MasonryProps } from "./Masonry.props";

describe("<Masonry />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <Masonry<{ name: string }>
        items={[{ name: "test" }]}
        renderItem={({ data }): React.ReactElement => <span>{data.name}</span>}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
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
    const { getByTestId } = render_test_with_provider(
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
    const { getByTestId, queryAllByTestId } = render_test_with_provider(
      <Masonry<{ name: string }>
        items={[{ name: "test" }]}
        renderItem={({ data }): React.ReactElement => <span>{data.name}</span>}
        slot_props={
          {
            item: { "data-testid": "item" },
            container: { "data-testid": "container" }
          } as MasonryProps<{ name: string }>["slot_props"]
        }
      />
    );

    expect(getByTestId("item")).toBeInTheDocument();
    expect(queryAllByTestId("container")).toBeNonEmptyArray();
  });
});
