import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import { testUser } from "../../mocks";
import User from "./user";

describe("<User />", () => {
  it("renders", () => {
    renderTestWithProvider(<User user={testUser} />);
  });

  it("renders when logged in", () => {
    renderTestWithProvider(<User user={testUser} />, {
      loggedIn: true
    });
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<User user={testUser} />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = renderTestWithProvider(<User user={testUser} />, {
      loggedIn: true
    });

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
