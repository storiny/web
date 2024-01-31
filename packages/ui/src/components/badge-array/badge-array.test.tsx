import { UserFlag } from "@storiny/shared";
import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import BadgeArray from "./badge-array";
import { BadgeArrayProps } from "./badge-array.props";

describe("<Stepper />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <BadgeArray flags={UserFlag.STAFF} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <BadgeArray flags={UserFlag.STAFF} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <BadgeArray
        as={"aside"}
        data-testid={"badge-array"}
        flags={UserFlag.STAFF}
      />
    );

    expect(getByTestId("badge-array").nodeName.toLowerCase()).toEqual("aside");
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <BadgeArray
        flags={UserFlag.STAFF}
        slot_props={
          {
            badge: { "data-testid": "badge" }
          } as BadgeArrayProps["slot_props"]
        }
      />
    );

    expect(getByTestId("bage")).toBeInTheDocument();
  });
});
