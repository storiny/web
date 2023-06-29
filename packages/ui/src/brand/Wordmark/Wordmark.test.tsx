import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Wordmark from "./Wordmark";
import styles from "./Wordmark.module.scss";
import { WordmarkProps, WordmarkSize } from "./Wordmark.props";

describe("<Wordmark />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<Wordmark />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<Wordmark />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Wordmark as={"aside"} data-testid={"wordmark"} />
    );

    expect(getByTestId("wordmark").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders size `md` and skips rendering beta label by default", () => {
    const { getByTestId, queryByTestId } = renderTestWithProvider(
      <Wordmark
        componentProps={
          {
            betaLabel: {
              "data-testid": "beta-label",
            },
          } as WordmarkProps["componentProps"]
        }
        data-testid={"wordmark"}
      />
    );

    expect(getByTestId("wordmark")).toHaveClass(styles.md);
    expect(queryByTestId("beta-label")).not.toBeInTheDocument();
  });

  (["lg", "md", "sm"] as WordmarkSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Wordmark data-testid={"wordmark"} size={size} />
      );

      expect(getByTestId("wordmark")).toHaveClass(styles[size]);
    });
  });

  it("renders beta label", () => {
    const { getByTestId } = renderTestWithProvider(
      <Wordmark
        componentProps={
          {
            betaLabel: {
              "data-testid": "beta-label",
            },
          } as WordmarkProps["componentProps"]
        }
        showBeta
      />
    );

    expect(getByTestId("beta-label")).toBeInTheDocument();
  });

  it("passes props to the component slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Wordmark
        componentProps={
          {
            betaLabel: { "data-testid": "beta-label" },
            label: { "data-testid": "label" },
            logo: { "data-testid": "logo" },
          } as WordmarkProps["componentProps"]
        }
        showBeta
      />
    );

    ["beta-label", "label", "logo"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
