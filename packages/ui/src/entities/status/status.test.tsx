import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Status from "./status";

describe("<Status />", () => {
  it("renders", () => {
    render_test_with_provider(<Status user_id={""} />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Status disable_modal user_id={""} />
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders with emoji", () => {
    const { getByRole } = render_test_with_provider(
      <Status
        data-testid={"status"}
        disable_modal
        emoji={"1f33f"}
        user_id={""}
      />
    );

    expect(getByRole("img")).toBeInTheDocument();
  });
});
