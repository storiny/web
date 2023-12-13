import { user_event } from "@storiny/test-utils";
import { screen, waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import AccountGeneralForm from "./general-form";

describe("<AccountGeneralForm />", () => {
  it("renders validation messages", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(<AccountGeneralForm on_submit={mock_submit} />, {
      logged_in: true
    });

    await user.clear(screen.getByTestId("name-input"));
    await user.click(screen.getByRole("button", { name: /save profile/i }));

    await wait_for(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(mock_submit).not.toBeCalled();
    });
  });

  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(<AccountGeneralForm on_submit={mock_submit} />, {
      logged_in: true
    });

    // Clear
    await user.clear(screen.getByTestId("name-input"));
    await user.clear(screen.getByTestId("location-input"));
    await user.clear(screen.getByTestId("bio-textarea"));
    // Type
    await user.type(screen.getByTestId("name-input"), "Test name");
    await user.type(screen.getByTestId("location-input"), "Test location");
    await user.type(screen.getByTestId("bio-textarea"), "Test bio");
    await user.click(screen.getByRole("button", { name: /save profile/i }));

    await wait_for(() => {
      expect(mock_submit).toHaveBeenCalledWith({
        name: "Test name",
        location: "Test location",
        bio: "Test bio"
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
