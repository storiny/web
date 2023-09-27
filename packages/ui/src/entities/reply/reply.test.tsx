import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import { testReply } from "../../mocks";
import Reply from "./reply";

describe("<Reply />", () => {
  it("renders", () => {
    render_test_with_provider(<Reply enableSsr reply={testReply} />);
  });

  it("renders when logged in", () => {
    render_test_with_provider(<Reply enableSsr reply={testReply} />, {
      loggedIn: true
    });
  });

  it("renders static mode", () => {
    render_test_with_provider(<Reply enableSsr isStatic reply={testReply} />, {
      loggedIn: true
    });
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Reply enableSsr reply={testReply} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(
      <Reply enableSsr reply={testReply} />,
      {
        loggedIn: true
      }
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations in static mode", async () => {
    const { container } = render_test_with_provider(
      <Reply enableSsr isStatic reply={testReply} />,
      {
        loggedIn: true
      }
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
