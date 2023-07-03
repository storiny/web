import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import { testTag } from "../../mocks";
import Tag from "./Tag";

describe("<Tag />", () => {
  it("renders", () => {
    renderTestWithProvider(<Tag tag={testTag} />);
  });

  it("renders when logged in", () => {
    renderTestWithProvider(<Tag tag={testTag} />, {
      loggedIn: true
    });
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<Tag tag={testTag} />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = renderTestWithProvider(<Tag tag={testTag} />, {
      loggedIn: true
    });

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
