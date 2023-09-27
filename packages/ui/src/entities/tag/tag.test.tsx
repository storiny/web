import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import { testTag } from "../../mocks";
import Tag from "./tag";

describe("<Tag />", () => {
  it("renders", () => {
    render_test_with_provider(<Tag tag={testTag} />);
  });

  it("renders when logged in", () => {
    render_test_with_provider(<Tag tag={testTag} />, {
      loggedIn: true
    });
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Tag tag={testTag} />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(<Tag tag={testTag} />, {
      loggedIn: true
    });

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
