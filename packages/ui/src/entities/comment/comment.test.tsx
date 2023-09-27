import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import { testComment } from "../../mocks";
import Comment from "./comment";

describe("<Comment />", () => {
  it("renders", () => {
    render_test_with_provider(<Comment comment={testComment} enableSsr />);
  });

  it("renders when logged in", () => {
    render_test_with_provider(<Comment comment={testComment} enableSsr />, {
      loggedIn: true
    });
  });

  it("renders extended mode", () => {
    render_test_with_provider(
      <Comment comment={testComment} enableSsr isExtended />,
      {
        loggedIn: true
      }
    );
  });

  it("renders static mode", () => {
    render_test_with_provider(
      <Comment comment={testComment} enableSsr isStatic />,
      {
        loggedIn: true
      }
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Comment comment={testComment} enableSsr />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(
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
    const { container } = render_test_with_provider(
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
    const { container } = render_test_with_provider(
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
