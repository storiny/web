import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";
import { render_test_with_provider } from "src/redux/test-utils";

import Wordmark from "./wordmark";
import styles from "./wordmark.module.scss";
import { WordmarkProps, WordmarkSize } from "./wordmark.props";

describe("<Wordmark />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<Wordmark />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Wordmark />);
    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <Wordmark as={"aside"} data-testid={"wordmark"} />
    );

    expect(getByTestId("wordmark").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders size `md` and skips rendering beta label by default", () => {
    const { getByTestId, queryByTestId } = render_test_with_provider(
      <Wordmark
        component_props={
          {
            beta_label: {
              "data-testid": "beta-label"
            }
          } as WordmarkProps["component_props"]
        }
        data-testid={"wordmark"}
      />
    );

    expect(getByTestId("wordmark")).toHaveClass(styles.md);
    expect(queryByTestId("beta-label")).not.toBeInTheDocument();
  });

  (["lg", "md", "sm"] as WordmarkSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = render_test_with_provider(
        <Wordmark data-testid={"wordmark"} size={size} />
      );

      expect(getByTestId("wordmark")).toHaveClass(styles[size]);
    });
  });

  it("renders beta label", () => {
    const { getByTestId } = render_test_with_provider(
      <Wordmark
        component_props={
          {
            beta_label: {
              "data-testid": "beta-label"
            }
          } as WordmarkProps["component_props"]
        }
        show_beta
      />
    );

    expect(getByTestId("beta-label")).toBeInTheDocument();
  });

  it("passes props to the component slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Wordmark
        component_props={
          {
            beta_label: { "data-testid": "beta-label" },
            label: { "data-testid": "label" },
            logo: { "data-testid": "logo" }
          } as WordmarkProps["component_props"]
        }
        show_beta
      />
    );

    ["beta-label", "label", "logo"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
