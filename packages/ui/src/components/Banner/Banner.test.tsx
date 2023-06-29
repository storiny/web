import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Banner from "./Banner";
import styles from "./Banner.module.scss";
import { BannerColor, BannerProps } from "./Banner.props";
import BannerProvider from "./Provider";

describe("<Banner />", () => {
  it("renders and matches snapshot", () => {
    const { baseElement, getByTestId } = renderTestWithProvider(
      <BannerProvider>
        <Banner data-testid={"banner"} open>
          Test
        </Banner>
      </BannerProvider>
    );

    expect(baseElement).toMatchSnapshot();
    expect(getByTestId("banner")).toBeInTheDocument();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = renderTestWithProvider(
      <BannerProvider>
        <Banner open>Test</Banner>
      </BannerProvider>
    );

    await waitFor(async () =>
      expect(
        await axe(baseElement, {
          rules: {
            "aria-allowed-role": { enabled: false },
            list: { enabled: false },
          },
        })
      ).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <BannerProvider>
        <Banner as={"aside"} data-testid={"banner"} open>
          Test
        </Banner>
      </BannerProvider>
    );

    expect(getByTestId("banner").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders color `inverted` by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <BannerProvider>
        <Banner data-testid={"banner"} open>
          Test
        </Banner>
      </BannerProvider>
    );

    expect(getByTestId("banner")).toHaveClass(styles.inverted);
  });

  (["inverted", "ruby", "lemon"] as BannerColor[]).forEach((color) => {
    it(`renders ${color} color`, () => {
      const { getByTestId } = renderTestWithProvider(
        <BannerProvider>
          <Banner color={color} data-testid={"banner"} open>
            Test
          </Banner>
        </BannerProvider>
      );

      expect(getByTestId("banner")).toHaveClass(styles[color]);
    });
  });

  it("renders icon", () => {
    const { getByTestId } = renderTestWithProvider(
      <BannerProvider>
        <Banner
          icon={"info"}
          open
          slotProps={
            {
              decorator: { "data-testid": "decorator" },
            } as BannerProps["slotProps"]
          }
        >
          Test
        </Banner>
      </BannerProvider>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <BannerProvider>
        <Banner
          icon={"info"}
          open
          slotProps={
            {
              decorator: { "data-testid": "decorator" },
              close: { "data-testid": "close" },
            } as BannerProps["slotProps"]
          }
        >
          Test
        </Banner>
      </BannerProvider>
    );

    ["decorator", "close"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
