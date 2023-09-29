import { AssetRating } from "@storiny/shared";
import { axe } from "@storiny/test-utils";
import { screen, waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Image from "./image";
import { ImageProps } from "./image.props";

describe("<Image />", () => {
  it("matches snapshot", async () => {
    const { container } = render_test_with_provider(
      <Image
        alt={"Test image"}
        hex={"fff"}
        img_key={""}
        slot_props={
          {
            fallback: { "data-testid": "fallback", delayMs: 0 }
          } as ImageProps["slot_props"]
        }
      />
    );

    await screen.findByTestId("fallback");
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Image alt={"Test image"} src={""} />
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <Image alt={"Test image"} as={"aside"} data-testid={"image"} />
    );

    expect(getByTestId("image").nodeName.toLowerCase()).toEqual("aside");
  });

  it("passes props to the overlay slot", async () => {
    const { getByTestId } = render_test_with_provider(
      <Image
        alt={"Test image"}
        img_key={""}
        slot_props={
          {
            fallback: { "data-testid": "fallback", delayMs: 0 }
          } as ImageProps["slot_props"]
        }
      />
    );

    await screen.findByTestId("fallback");
    expect(getByTestId("fallback")).toBeInTheDocument();
  });

  it("passes props to the fallback slot", () => {
    const { getByTestId } = render_test_with_provider(
      <Image
        alt={"Test image"}
        img_key={""}
        rating={AssetRating.SENSITIVE}
        slot_props={
          {
            overlay: { "data-testid": "overlay" }
          } as ImageProps["slot_props"]
        }
      />
    );

    expect(getByTestId("overlay")).toBeInTheDocument();
  });

  it("renders with hex color", () => {
    const { getByTestId } = render_test_with_provider(
      <Image alt={"Test image"} data-testid={"image"} hex={"000"} />
    );

    expect(getByTestId("image")).toHaveStyle({
      "--hex": "#000"
    });
  });

  it("renders with explicit width and height", () => {
    const { getByTestId } = render_test_with_provider(
      <Image alt={"Test image"} data-testid={"image"} height={32} width={64} />
    );

    expect(getByTestId("image")).toHaveStyle({
      "--width": "64px",
      "--height": "32px"
    });
  });

  [
    AssetRating.VIOLENCE,
    AssetRating.SENSITIVE,
    AssetRating.SUGGESTIVE_NUDITY
  ].forEach((rating) => {
    it(`renders overlay for \`${rating}\` rating`, () => {
      const { getByTestId } = render_test_with_provider(
        <Image
          alt={"Test image"}
          img_key={""}
          rating={rating}
          slot_props={
            {
              overlay: { "data-testid": "overlay" }
            } as ImageProps["slot_props"]
          }
        />
      );

      expect(getByTestId("overlay")).toBeInTheDocument();
    });
  });
});
