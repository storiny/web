import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Banner from "./banner";
import styles from "./banner.module.scss";
import { BannerColor, BannerProps } from "./banner.props";
import BannerProvider from "./provider";

describe("<Banner />", () => {
  it("renders and matches snapshot", () => {
    const { baseElement, getByTestId } = render_test_with_provider(
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
    const { baseElement } = render_test_with_provider(
      <BannerProvider>
        <Banner open>Test</Banner>
      </BannerProvider>
    );

    await wait_for(async () =>
      expect(
        await axe(baseElement, {
          rules: {
            "aria-allowed-role": { enabled: false },
            list: { enabled: false }
          }
        })
      ).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <BannerProvider>
        <Banner as={"aside"} data-testid={"banner"} open>
          Test
        </Banner>
      </BannerProvider>
    );

    expect(getByTestId("banner").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders color `inverted` by default", () => {
    const { getByTestId } = render_test_with_provider(
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
      const { getByTestId } = render_test_with_provider(
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
    const { getByTestId } = render_test_with_provider(
      <BannerProvider>
        <Banner
          icon={"info"}
          open
          slot_props={
            {
              decorator: { "data-testid": "decorator" }
            } as BannerProps["slot_props"]
          }
        >
          Test
        </Banner>
      </BannerProvider>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <BannerProvider>
        <Banner
          icon={"info"}
          open
          slot_props={
            {
              decorator: { "data-testid": "decorator" },
              close: { "data-testid": "close" }
            } as BannerProps["slot_props"]
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
