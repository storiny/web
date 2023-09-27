import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Status from "./Status";
import styles from "./Status.module.scss";

describe("<Status />", () => {
  it("renders", () => {
    render_test_with_provider(<Status />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Status />);

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as editable", () => {
    const { getByTestId } = render_test_with_provider(
      <Status data-testid={"status"} editable />
    );

    expect(getByTestId("status")).toHaveClass(styles.editable);
  });

  it("renders with emoji", () => {
    const { getByRole } = render_test_with_provider(
      <Status data-testid={"status"} emoji={"/emoji.png"} />
    );

    expect(getByRole("img")).toBeInTheDocument();
  });
});
