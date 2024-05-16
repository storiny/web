import { user_event } from "@storiny/test-utils";
import { TEST_BLOG } from "@storiny/ui/src/mocks";
import { screen } from "@testing-library/react";
import React from "react";

import BlogContextProvider from "~/common/context/blog";
import { render_test_with_provider } from "~/redux/test-utils";

import InviteEditor from "./invite-editor";

describe("<InviteEditor />", () => {
  it("renders validation messages", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: null }}>
        <InviteEditor on_submit={mock_submit} />
      </BlogContextProvider>,
      {
        logged_in: true
      }
    );

    await user.click(
      screen.getByTestId("invite-editor-button") // Open modal
    );

    await user.type(screen.getByTestId("username-input"), " "); // The button is disabled until the form is dirty
    await user.click(screen.getByRole("button", { name: /invite/i }));

    expect((await screen.findAllByRole("alert")).length).not.toEqual(0);
    expect(mock_submit).not.toHaveBeenCalled();
  });

  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: null }}>
        <InviteEditor on_submit={mock_submit} />
      </BlogContextProvider>,
      {
        logged_in: true
      }
    );

    await user.click(
      screen.getByTestId("invite-editor-button") // Open modal
    );

    await user.type(screen.getByTestId("username-input"), "test_user");
    await user.click(screen.getByRole("button", { name: /invite/i }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(mock_submit).toHaveBeenCalledWith({
      username: "test_user"
    });
  });
});
