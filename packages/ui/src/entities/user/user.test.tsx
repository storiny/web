import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import { TEST_USER } from "../../mocks";
import User from "./user";

describe("<User />", () => {
  it("renders", () => {
    render_test_with_provider(<User user={TEST_USER} />);
  });

  it("renders when logged in", () => {
    render_test_with_provider(<User user={TEST_USER} />, {
      logged_in: true
    });
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<User user={TEST_USER} />);
    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(<User user={TEST_USER} />, {
      logged_in: true
    });

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
