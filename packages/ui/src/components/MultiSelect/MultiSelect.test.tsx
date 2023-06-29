import { axe } from "@storiny/test-utils";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import MultiSelect from "./MultiSelect";
import styles from "./MultiSelect.module.scss";
import { MultiSelectColor, MultiSelectSize } from "./MultiSelect.props";

describe("<MultiSelect />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<MultiSelect />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders with color `inverted` and size `md` by default", () => {
    const { container } = renderTestWithProvider(<MultiSelect />);
    expect(container.firstChild).toHaveClass(...[styles.inverted, styles.md]);
  });

  (["lg", "md"] as MultiSelectSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { container } = renderTestWithProvider(<MultiSelect size={size} />);
      expect(container.firstChild).toHaveClass(styles[size]);
    });
  });

  (["inverted", "ruby"] as MultiSelectColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { container } = renderTestWithProvider(
        <MultiSelect color={color} />
      );

      expect(container.firstChild).toHaveClass(styles[color]);
    });
  });
});
