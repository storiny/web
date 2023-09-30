import { axe } from "@storiny/test-utils";
import { screen, waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import common_styles from "../common/avatar-size.module.scss";
import Avatar from "./avatar";
import styles from "./avatar.module.scss";
import { AvatarProps, AvatarSize } from "./avatar.props";

describe("<Avatar />", () => {
  it("matches snapshot", async () => {
    const { container } = render_test_with_provider(
      <Avatar
        alt={"Test avatar"}
        hex={"fff"}
        slot_props={
          {
            fallback: { "data-testid": "fallback", delayMs: 0 }
          } as AvatarProps["slot_props"]
        }
        src={""}
      />
    );

    await screen.findByTestId("fallback");
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Avatar alt={"Test avatar"} src={"/some-img.png"} />
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <Avatar alt={"Test avatar"} as={"aside"} data-testid={"avatar"} />
    );

    expect(getByTestId("avatar").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders with size `md` and border by default", () => {
    const { getByTestId } = render_test_with_provider(
      <Avatar alt={"Test avatar"} data-testid={"avatar"} />
    );

    // The Default size is explicitly specified in the `avatar` class to allow the Avatar component infer size from the AvatarGroup component.
    expect(getByTestId("avatar")).toHaveClass(
      ...[styles.avatar, styles.border]
    );
  });

  (["xl2", "xl", "lg", "md", "sm", "xs"] as AvatarSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = render_test_with_provider(
        <Avatar alt={"Test avatar"} data-testid={"avatar"} size={size} />
      );

      expect(getByTestId("avatar")).toHaveClass(common_styles[size]);
    });
  });

  it("computes and applies the `--bg` variable to the fallback", async () => {
    render_test_with_provider(
      <Avatar
        alt={"Test avatar"}
        label={"Test"}
        slot_props={
          {
            fallback: { "data-testid": "fallback", delayMs: 0 }
          } as AvatarProps["slot_props"]
        }
        src={""}
      />
    );

    const fallback = await screen.findByTestId("fallback");
    expect(fallback).toHaveStyle({
      "--bg": "hsl(26deg 35% 50%)"
    });
  });

  describe("fallback initials", () => {
    it("renders with first and last name initials", async () => {
      const { getByTestId } = render_test_with_provider(
        <Avatar
          alt={"Test avatar"}
          label={"First Last"}
          slot_props={
            {
              fallback: { "data-testid": "fallback", delayMs: 0 }
            } as AvatarProps["slot_props"]
          }
          src={""}
        />
      );

      await screen.findByTestId("fallback");
      expect(getByTestId("fallback")).toHaveTextContent(/^FL$/);
    });

    it("renders with first, middle, and last name initials", async () => {
      const { getByTestId } = render_test_with_provider(
        <Avatar
          alt={"Test avatar"}
          label={"First Middle Last"}
          slot_props={
            {
              fallback: { "data-testid": "fallback", delayMs: 0 }
            } as AvatarProps["slot_props"]
          }
          src={""}
        />
      );

      await screen.findByTestId("fallback");
      expect(getByTestId("fallback")).toHaveTextContent(/^FL$/);
    });

    it("renders with just first name initial", async () => {
      const { getByTestId } = render_test_with_provider(
        <Avatar
          alt={"Test avatar"}
          label={"First"}
          slot_props={
            {
              fallback: { "data-testid": "fallback", delayMs: 0 }
            } as AvatarProps["slot_props"]
          }
          src={""}
        />
      );

      await screen.findByTestId("fallback");
      expect(getByTestId("fallback")).toHaveTextContent(/^F$/);
    });

    it("uses `alt` when `label` is not provided", async () => {
      const { getByTestId } = render_test_with_provider(
        <Avatar
          alt={"First Last"}
          slot_props={
            {
              fallback: { "data-testid": "fallback", delayMs: 0 }
            } as AvatarProps["slot_props"]
          }
          src={""}
        />
      );

      await screen.findByTestId("fallback");
      expect(getByTestId("fallback")).toHaveTextContent(/^FL$/);
    });

    it("handles empty names", async () => {
      const { getByTestId } = render_test_with_provider(
        <Avatar
          alt={""}
          label={""}
          slot_props={
            {
              fallback: { "data-testid": "fallback", delayMs: 0 }
            } as AvatarProps["slot_props"]
          }
          src={""}
        />
      );

      await screen.findByTestId("fallback");
      expect(getByTestId("fallback")).toHaveTextContent(/^$/);
    });

    it("does not break on non-english names", async () => {
      const { getByTestId } = render_test_with_provider(
        <Avatar
          alt={"Test avatar"}
          label={"あやか"}
          slot_props={
            {
              fallback: { "data-testid": "fallback", delayMs: 0 }
            } as AvatarProps["slot_props"]
          }
          src={""}
        />
      );

      await screen.findByTestId("fallback");
      expect(getByTestId("fallback")).toHaveTextContent(/^$/);
    });
  });

  it("passes props to the fallback slot", async () => {
    const { getByTestId } = render_test_with_provider(
      <Avatar
        alt={"Test avatar"}
        slot_props={
          {
            fallback: { "data-testid": "fallback", delayMs: 0 }
          } as AvatarProps["slot_props"]
        }
        src={""}
      />
    );

    await screen.findByTestId("fallback");
    expect(getByTestId("fallback")).toBeInTheDocument();
  });

  it("renders children", async () => {
    const { getByTestId } = render_test_with_provider(
      <Avatar
        alt={"Test avatar"}
        slot_props={
          {
            fallback: { "data-testid": "fallback", delayMs: 0 }
          } as AvatarProps["slot_props"]
        }
      >
        AB
      </Avatar>
    );

    await screen.findByTestId("fallback");
    expect(getByTestId("fallback")).toHaveTextContent(/^AB$/);
  });

  it("does not render image when children are passed", async () => {
    const { container } = render_test_with_provider(
      <Avatar alt={"Test avatar"}>AB</Avatar>
    );

    await wait_for(() => {
      expect(container.querySelector("img")).toBeNull();
    });
  });
});
