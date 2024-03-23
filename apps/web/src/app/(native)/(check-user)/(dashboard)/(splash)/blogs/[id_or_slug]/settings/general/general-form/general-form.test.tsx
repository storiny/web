import { StoryCategory } from "@storiny/shared";
import { user_event } from "@storiny/test-utils";
import { TEST_BLOG } from "@storiny/ui/src/mocks";
import { screen } from "@testing-library/react";
import React from "react";

import BlogContextProvider from "~/common/context/blog";
import { render_test_with_provider } from "~/redux/test-utils";

import BlogGeneralForm from "./general-form";

describe("<BlogGeneralForm />", () => {
  it("renders validation messages", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: "editor" }}>
        <BlogGeneralForm on_submit={mock_submit} />
      </BlogContextProvider>,
      {
        logged_in: true
      }
    );

    await user.clear(screen.getByTestId("name-input"));
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(mock_submit).not.toHaveBeenCalled();
  });

  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <BlogContextProvider
        value={{ ...TEST_BLOG, category: StoryCategory.DIY, role: "editor" }}
      >
        <BlogGeneralForm on_submit={mock_submit} />
      </BlogContextProvider>,
      {
        logged_in: true
      }
    );

    // Clear
    await user.clear(screen.getByTestId("name-input"));
    await user.clear(screen.getByTestId("description-textarea"));
    // Type
    await user.type(screen.getByTestId("name-input"), "Test name");
    await user.type(
      screen.getByTestId("description-textarea"),
      "Test description"
    );
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(mock_submit).toHaveBeenCalledWith({
      name: "Test name",
      description: "Test description",
      category: StoryCategory.DIY
    });
  });
});
