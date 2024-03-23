import { user_event } from "@storiny/test-utils";
import { TEST_BLOG } from "@storiny/ui/src/mocks";
import { screen } from "@testing-library/react";
import React from "react";

import BlogContextProvider from "~/common/context/blog";
import { render_test_with_provider } from "~/redux/test-utils";

import DeleteAction from "./delete-action";

describe("<DeleteAction />", () => {
  it("renders validation messages", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: "owner" }}>
        <DeleteAction on_submit={mock_submit} />
      </BlogContextProvider>,
      {
        logged_in: true
      }
    );

    await user.click(
      screen.getByRole("button", { name: /delete this blog/i }) // Open modal
    );

    await user.type(screen.getByTestId("current-password-input"), " "); // The button is disabled until the form is dirty
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    expect((await screen.findAllByRole("alert")).length).not.toEqual(0);
    expect(mock_submit).not.toHaveBeenCalled();
  });

  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: "owner" }}>
        <DeleteAction on_submit={mock_submit} />
      </BlogContextProvider>,
      {
        logged_in: true
      }
    );

    await user.click(
      screen.getByRole("button", { name: /delete this blog/i }) // Open modal
    );

    await user.type(
      screen.getByTestId("current-password-input"),
      "test-password"
    );

    await user.click(screen.getByRole("button", { name: /confirm/i }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(mock_submit).toHaveBeenCalledWith({
      current_password: "test-password"
    });
  });
});
