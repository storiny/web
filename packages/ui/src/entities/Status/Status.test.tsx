import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Status from "./Status";
import styles from "./Status.module.scss";

describe("<Status />", () => {
  it("renders", () => {
    renderTestWithProvider(<Status />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<Status />);

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as editable", () => {
    const { getByTestId } = renderTestWithProvider(
      <Status data-testid={"status"} editable />
    );

    expect(getByTestId("status")).toHaveClass(styles.editable);
  });

  it("renders with emoji", () => {
    const { getByRole } = renderTestWithProvider(
      <Status data-testid={"status"} emoji={"/emoji.png"} />
    );

    expect(getByRole("img")).toBeInTheDocument();
  });
});
