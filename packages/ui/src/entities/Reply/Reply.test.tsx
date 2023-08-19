import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import { testReply } from "../../mocks";
import Reply from "./Reply";

describe("<Reply />", () => {
  it("renders", () => {
    renderTestWithProvider(<Reply enableSsr reply={testReply} />);
  });

  it("renders when logged in", () => {
    renderTestWithProvider(<Reply enableSsr reply={testReply} />, {
      loggedIn: true
    });
  });

  it("renders static mode", () => {
    renderTestWithProvider(<Reply enableSsr isStatic reply={testReply} />, {
      loggedIn: true
    });
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Reply enableSsr reply={testReply} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = renderTestWithProvider(
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
    const { container } = renderTestWithProvider(
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
