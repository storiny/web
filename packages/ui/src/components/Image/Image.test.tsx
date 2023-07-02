import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import { screen } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Image from "./Image";
import { ImageProps } from "./Image.props";

describe("<Image />", () => {
  it("matches snapshot", async () => {
    const { container } = renderTestWithProvider(
      <Image
        alt={"Test image"}
        hex={"fff"}
        imgId={""}
        slotProps={
          {
            fallback: { "data-testid": "fallback", delayMs: 0 }
          } as ImageProps["slotProps"]
        }
      />
    );

    await screen.findByTestId("fallback");
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Image alt={"Test image"} src={""} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Image alt={"Test image"} as={"aside"} data-testid={"image"} />
    );

    expect(getByTestId("image").nodeName.toLowerCase()).toEqual("aside");
  });

  it("passes props to the fallback slot", async () => {
    const { getByTestId } = renderTestWithProvider(
      <Image
        alt={"Test image"}
        imgId={""}
        slotProps={
          {
            fallback: { "data-testid": "fallback", delayMs: 0 }
          } as ImageProps["slotProps"]
        }
      />
    );

    await screen.findByTestId("fallback");
    expect(getByTestId("fallback")).toBeInTheDocument();
  });

  it("renders with hex color", () => {
    const { getByTestId } = renderTestWithProvider(
      <Image alt={"Test image"} data-testid={"image"} hex={"000"} />
    );

    expect(getByTestId("image")).toHaveStyle({
      "--hex": "#000"
    });
  });

  it("renders with explicit width and height", () => {
    const { getByTestId } = renderTestWithProvider(
      <Image alt={"Test image"} data-testid={"image"} height={32} width={64} />
    );

    expect(getByTestId("image")).toHaveStyle({
      "--width": "64px",
      "--height": "32px"
    });
  });
});
