import { API_VERSION } from "@storiny/shared";
import { screen } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import React from "react";

import { GetRightSidebarContentResponse } from "~/redux/features";
import { render_test_with_provider } from "src/redux/test-utils";

import { testStory, testTag, testUser } from "../../mocks";
import RightSidebar from "./RightSidebar";
import { RightSidebarProps } from "./RightSidebar.props";

const server = setupServer(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v${API_VERSION}/rsb-content`,
    (req, res, ctx) =>
      res(
        ctx.json({
          stories: [testStory],
          users: [testUser],
          tags: [testTag]
        } as GetRightSidebarContentResponse)
      )
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("<RightSidebar />", () => {
  it("renders", () => {
    render_test_with_provider(<RightSidebar forceMount />);
  });

  it("renders with data and default children", async () => {
    const { container } = render_test_with_provider(
      <RightSidebar forceMount />
    );
    await screen.findAllByText("Test story");

    // Renders stories
    expect(container.firstChild).toHaveTextContent("Test story");
    // Renders users
    expect(container.firstChild).toHaveTextContent("Test user");
    // Renders tags
    expect(container.firstChild).toHaveTextContent("test-tag");
  });

  it("renders with custom children", () => {
    const { getByTestId } = render_test_with_provider(
      <RightSidebar forceMount>
        <span data-testid={"child"} />
      </RightSidebar>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("passes props to the component slots", () => {
    const { getByTestId } = render_test_with_provider(
      <RightSidebar
        component_props={
          {
            wrapper: { "data-testid": "wrapper" }
          } as RightSidebarProps["component_props"]
        }
        forceMount
      />
    );

    expect(getByTestId("wrapper")).toBeInTheDocument();
  });
});
