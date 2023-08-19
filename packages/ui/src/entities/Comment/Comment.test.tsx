import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import { testComment } from "../../mocks";
import Comment from "./Comment";

describe("<Comment />", () => {
  it("renders", () => {
    renderTestWithProvider(<Comment comment={testComment} enableSsr />);
  });

  it("renders when logged in", () => {
    renderTestWithProvider(<Comment comment={testComment} enableSsr />, {
      loggedIn: true
    });
  });

  it("renders extended mode", () => {
    renderTestWithProvider(
      <Comment comment={testComment} enableSsr isExtended />,
      {
        loggedIn: true
      }
    );
  });

  it("renders static mode", () => {
    renderTestWithProvider(
      <Comment comment={testComment} enableSsr isStatic />,
      {
        loggedIn: true
      }
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Comment comment={testComment} enableSsr />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = renderTestWithProvider(
      <Comment comment={testComment} enableSsr />,
      {
        loggedIn: true
      }
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations in extended mode", async () => {
    const { container } = renderTestWithProvider(
      <Comment comment={testComment} enableSsr isExtended />,
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
      <Comment comment={testComment} enableSsr isStatic />,
      {
        loggedIn: true
      }
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
