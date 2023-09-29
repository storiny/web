import { API_VERSION } from "@storiny/shared";
import { screen } from "@testing-library/react";
import { rest } from "msw";
import { setupServer as setup_server } from "msw/node";
import React from "react";

import { GetRightSidebarContentResponse } from "~/redux/features";
import { render_test_with_provider } from "src/redux/test-utils";

import { TEST_STORY, TEST_TAG, TEST_USER } from "../../mocks";
import RightSidebar from "./right-sidebar";
import { RightSidebarProps } from "./right-sidebar.props";

const server = setup_server(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v${API_VERSION}/rsb-content`,
    (req, res, ctx) =>
      res(
        ctx.json({
          stories: [TEST_STORY],
          users: [TEST_USER],
          tags: [TEST_TAG]
        } as GetRightSidebarContentResponse)
      )
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("<RightSidebar />", () => {
  it("renders", () => {
    render_test_with_provider(<RightSidebar force_mount />);
  });

  it("renders with data and default children", async () => {
    const { container } = render_test_with_provider(
      <RightSidebar force_mount />
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
      <RightSidebar force_mount>
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
        force_mount
      />
    );

    expect(getByTestId("wrapper")).toBeInTheDocument();
  });
});
