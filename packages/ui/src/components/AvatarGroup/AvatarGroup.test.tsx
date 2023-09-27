import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import { screen } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Avatar from "../Avatar";
import commonStyles from "../common/AvatarSize.module.scss";
import AvatarGroup from "./AvatarGroup";
import styles from "./AvatarGroup.module.scss";
import { AvatarGroupSize } from "./AvatarGroup.props";
import { AvatarGroupProps } from "./AvatarGroup.props";

describe("<AvatarGroup />", () => {
  it("matches snapshot", async () => {
    const { container } = render_test_with_provider(
      <AvatarGroup
        slot_props={
          {
            overflow: {
              slot_props: {
                fallback: { "data-testid": "overflow", delayMs: 0 }
              }
            }
          } as AvatarGroupProps["slot_props"]
        }
      >
        {[...Array(5)].map((_, index) => (
          <Avatar alt={"Test"} key={index} />
        ))}
      </AvatarGroup>
    );

    await screen.findByTestId("overflow");
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<AvatarGroup />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <AvatarGroup as={"aside"} data-testid={"avatar-group"} />
    );

    expect(getByTestId("avatar-group").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders with size `md` by default", () => {
    const { getByTestId } = render_test_with_provider(
      <AvatarGroup data-testid={"avatar-group"}>
        <Avatar alt={"Test"} />
      </AvatarGroup>
    );

    expect(getByTestId("avatar-group")).toHaveClass(styles["avatar-group"]);
  });

  it("renders without children", () => {
    const { getByTestId } = render_test_with_provider(
      <AvatarGroup data-testid={"avatar-group"} />
    );

    expect(getByTestId("avatar-group")).toBeInTheDocument();
  });

  (["xl2", "xl", "lg", "md", "sm", "xs"] as AvatarGroupSize[]).forEach(
    (size) => {
      it(`renders \`${size}\` size`, () => {
        const { getByTestId } = render_test_with_provider(
          <AvatarGroup data-testid={"avatar-group"} size={size} />
        );

        expect(getByTestId("avatar-group")).toHaveClass(commonStyles[size]);
      });
    }
  );

  it("passes props to the overflow slot", () => {
    const { getByTestId } = render_test_with_provider(
      <AvatarGroup
        slot_props={
          {
            overflow: { "data-testid": "overflow" }
          } as AvatarGroupProps["slot_props"]
        }
      >
        {[...Array(5)].map((_, index) => (
          <Avatar alt={"Test"} key={index} />
        ))}
      </AvatarGroup>
    );

    expect(getByTestId("overflow")).toBeInTheDocument();
  });

  it("does not render overflow for less than 3 children", () => {
    const { container } = render_test_with_provider(
      <AvatarGroup
        slot_props={
          {
            overflow: { "data-overflow": "" }
          } as AvatarGroupProps["slot_props"]
        }
      >
        {[...Array(2)].map((_, index) => (
          <Avatar alt={"Test"} key={index} />
        ))}
      </AvatarGroup>
    );

    expect(container.querySelector("[data-overflow]")).toBeNull();
  });

  it("truncates child avatars to 3", async () => {
    const { container, getByTestId } = render_test_with_provider(
      <AvatarGroup
        slot_props={
          {
            overflow: {
              slot_props: {
                fallback: { "data-testid": "overflow-fallback", delayMs: 0 }
              }
            }
          } as AvatarGroupProps["slot_props"]
        }
      >
        {[...Array(5)].map((_, index) => (
          <Avatar alt={"Test"} data-avatar key={index} />
        ))}
      </AvatarGroup>
    );

    await screen.findByTestId("overflow-fallback");
    const overflow = getByTestId("overflow-fallback");

    expect(overflow).toHaveTextContent(/^\+2$/);
    expect(container.querySelectorAll("[data-avatar]").length).toEqual(3);
  });
});
