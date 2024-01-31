import { API_VERSION } from "@storiny/shared";
import { axe, wait_for_position } from "@storiny/test-utils";
import { rest } from "msw";
import { setupServer as setup_server } from "msw/node";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_USER } from "../../mocks";
import UserHoverCard from "./user-hover-card";
import { UserHoverCardProps } from "./user-hover-card.props";

const server = setup_server(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v${API_VERSION}/public/cards/user/:identifier`,
    (req, res, ctx) => res(ctx.json(TEST_USER))
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("<UserHoverCard />", () => {
  it("matches snapshot", async () => {
    const { baseElement } = render_test_with_provider(
      <UserHoverCard identifier={"test"} open />
    );

    await wait_for_position();

    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = render_test_with_provider(
      <UserHoverCard identifier={"test"} open />
    );

    expect(
      await axe(baseElement, {
        rules: {
          region: { enabled: false }
        }
      })
    ).toHaveNoViolations();
  });

  it("renders as a polymorphic element", async () => {
    const { getByTestId } = render_test_with_provider(
      <UserHoverCard
        as={"aside"}
        identifier={"test"}
        open
        slot_props={
          {
            content: {
              "data-testid": "content"
            }
          } as UserHoverCardProps["slot_props"]
        }
      />
    );

    expect(getByTestId("content").nodeName.toLowerCase()).toEqual("aside");
  });

  it("passes props to the element slots", async () => {
    const { getByTestId } = render_test_with_provider(
      <UserHoverCard
        identifier={"test"}
        open
        slot_props={
          {
            arrow: { "data-testid": "arrow" },
            content: { "data-testid": "content" }
          } as UserHoverCardProps["slot_props"]
        }
      >
        Test
      </UserHoverCard>
    );

    await wait_for_position();

    ["arrow", "content"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
