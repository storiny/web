import { axe } from "@storiny/test-utils";
import { screen, waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import commonStyles from "../common/AvatarSize.module.scss";
import Avatar from "./Avatar";
import styles from "./Avatar.module.scss";
import { AvatarProps, AvatarSize } from "./Avatar.props";

describe("<Avatar />", () => {
  it("matches snapshot", async () => {
    const { container } = renderTestWithProvider(
      <Avatar
        alt={"Test avatar"}
        hex={"fff"}
        slotProps={
          {
            fallback: { "data-testid": "fallback", delayMs: 0 },
          } as AvatarProps["slotProps"]
        }
        src={""}
      />
    );

    await screen.findByTestId("fallback");
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Avatar alt={"Test avatar"} src={"/some-img.png"} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Avatar alt={"Test avatar"} as={"aside"} data-testid={"avatar"} />
    );

    expect(getByTestId("avatar").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders with size `md` and border by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <Avatar alt={"Test avatar"} data-testid={"avatar"} />
    );

    // Default size is explicitly specified in the `avatar` class to allow
    // the Avatar component infer size from the AvatarGroup component
    expect(getByTestId("avatar")).toHaveClass(
      ...[styles.avatar, styles.border]
    );
  });

  (["xl2", "xl", "lg", "md", "sm", "xs"] as AvatarSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Avatar alt={"Test avatar"} data-testid={"avatar"} size={size} />
      );

      expect(getByTestId("avatar")).toHaveClass(commonStyles[size]);
    });
  });

  it("computes and applies the `--bg` variable to the fallback", async () => {
    renderTestWithProvider(
      <Avatar
        alt={"Test avatar"}
        label={"Test"}
        slotProps={
          {
            fallback: { "data-testid": "fallback", delayMs: 0 },
          } as AvatarProps["slotProps"]
        }
        src={""}
      />
    );

    const fallback = await screen.findByTestId("fallback");
    expect(fallback).toHaveStyle({
      "--bg": "hsl(26deg 35% 50%)",
    });
  });

  describe("fallback initials", () => {
    it("renders with first and last name initials", async () => {
      const { getByTestId } = renderTestWithProvider(
        <Avatar
          alt={"Test avatar"}
          label={"First Last"}
          slotProps={
            {
              fallback: { "data-testid": "fallback", delayMs: 0 },
            } as AvatarProps["slotProps"]
          }
          src={""}
        />
      );

      await screen.findByTestId("fallback");
      expect(getByTestId("fallback")).toHaveTextContent(/^FL$/);
    });

    it("renders with first, middle, and last name initials", async () => {
      const { getByTestId } = renderTestWithProvider(
        <Avatar
          alt={"Test avatar"}
          label={"First Middle Last"}
          slotProps={
            {
              fallback: { "data-testid": "fallback", delayMs: 0 },
            } as AvatarProps["slotProps"]
          }
          src={""}
        />
      );

      await screen.findByTestId("fallback");
      expect(getByTestId("fallback")).toHaveTextContent(/^FL$/);
    });

    it("renders with just first name initial", async () => {
      const { getByTestId } = renderTestWithProvider(
        <Avatar
          alt={"Test avatar"}
          label={"First"}
          slotProps={
            {
              fallback: { "data-testid": "fallback", delayMs: 0 },
            } as AvatarProps["slotProps"]
          }
          src={""}
        />
      );

      await screen.findByTestId("fallback");
      expect(getByTestId("fallback")).toHaveTextContent(/^F$/);
    });

    it("uses `alt` when `label` is not provided", async () => {
      const { getByTestId } = renderTestWithProvider(
        <Avatar
          alt={"First Last"}
          slotProps={
            {
              fallback: { "data-testid": "fallback", delayMs: 0 },
            } as AvatarProps["slotProps"]
          }
          src={""}
        />
      );

      await screen.findByTestId("fallback");
      expect(getByTestId("fallback")).toHaveTextContent(/^FL$/);
    });

    it("handles empty names", async () => {
      const { getByTestId } = renderTestWithProvider(
        <Avatar
          alt={""}
          label={""}
          slotProps={
            {
              fallback: { "data-testid": "fallback", delayMs: 0 },
            } as AvatarProps["slotProps"]
          }
          src={""}
        />
      );

      await screen.findByTestId("fallback");
      expect(getByTestId("fallback")).toHaveTextContent(/^$/);
    });

    it("does not break on non-english names", async () => {
      const { getByTestId } = renderTestWithProvider(
        <Avatar
          alt={"Test avatar"}
          label={"あやか"}
          slotProps={
            {
              fallback: { "data-testid": "fallback", delayMs: 0 },
            } as AvatarProps["slotProps"]
          }
          src={""}
        />
      );

      await screen.findByTestId("fallback");
      expect(getByTestId("fallback")).toHaveTextContent(/^$/);
    });
  });

  it("passes props to the fallback slot", async () => {
    const { getByTestId } = renderTestWithProvider(
      <Avatar
        alt={"Test avatar"}
        slotProps={
          {
            fallback: { "data-testid": "fallback", delayMs: 0 },
          } as AvatarProps["slotProps"]
        }
        src={""}
      />
    );

    await screen.findByTestId("fallback");
    expect(getByTestId("fallback")).toBeInTheDocument();
  });

  it("renders children", async () => {
    const { getByTestId } = renderTestWithProvider(
      <Avatar
        alt={"Test avatar"}
        slotProps={
          {
            fallback: { "data-testid": "fallback", delayMs: 0 },
          } as AvatarProps["slotProps"]
        }
      >
        AB
      </Avatar>
    );

    await screen.findByTestId("fallback");
    expect(getByTestId("fallback")).toHaveTextContent(/^AB$/);
  });

  it("does not render image when children are passed", async () => {
    const { container } = renderTestWithProvider(
      <Avatar alt={"Test avatar"}>AB</Avatar>
    );

    await waitFor(() => {
      expect(container.querySelector("img")).toBeNull();
    });
  });
});
