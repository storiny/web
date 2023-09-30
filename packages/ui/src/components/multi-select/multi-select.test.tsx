import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import MultiSelect from "./multi-select";
import styles from "./multi-select.module.scss";
import { MultiSelectColor, MultiSelectSize } from "./multi-select.props";

describe("<MultiSelect />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <MultiSelect options={[]} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders with color `inverted` and size `md` by default", () => {
    const { container } = render_test_with_provider(
      <MultiSelect options={[]} />
    );
    expect(container.firstChild).toHaveClass(...[styles.inverted, styles.md]);
  });

  (["lg", "md"] as MultiSelectSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { container } = render_test_with_provider(
        <MultiSelect options={[]} size={size} />
      );
      expect(container.firstChild).toHaveClass(styles[size]);
    });
  });

  (["inverted", "ruby"] as MultiSelectColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { container } = render_test_with_provider(
        <MultiSelect color={color} options={[]} />
      );

      expect(container.firstChild).toHaveClass(styles[color]);
    });
  });
});
