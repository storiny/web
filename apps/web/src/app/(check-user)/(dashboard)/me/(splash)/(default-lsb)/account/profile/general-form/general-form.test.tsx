import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import AccountGeneralForm from "./general-form";

describe("<AccountGeneralForm />", () => {
  it("renders validation messages", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    renderTestWithProvider(<AccountGeneralForm onSubmit={mockSubmit} />, {
      loggedIn: true
    });

    await act(async () => {
      await user.clear(screen.getByTestId("name-input"));
      await user.click(screen.getByRole("button", { name: /save profile/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(mockSubmit).not.toBeCalled();
    });
  });

  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    renderTestWithProvider(<AccountGeneralForm onSubmit={mockSubmit} />, {
      loggedIn: true
    });

    await act(async () => {
      // Clear
      await user.clear(screen.getByTestId("name-input"));
      await user.clear(screen.getByTestId("location-input"));
      await user.clear(screen.getByTestId("bio-textarea"));
      // Type
      await user.type(screen.getByTestId("name-input"), "Test name");
      await user.type(screen.getByTestId("location-input"), "Test location");
      await user.type(screen.getByTestId("bio-textarea"), "Test bio");
      await user.click(screen.getByRole("button", { name: /save profile/i }));
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: "Test name",
        location: "Test location",
        bio: "Test bio"
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
