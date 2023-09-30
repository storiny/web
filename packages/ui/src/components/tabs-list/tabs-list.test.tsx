import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Tab from "../tab";
import tab_styles from "../tab/tab.module.scss";
import Tabs from "../tabs";
import TabsList from "./tabs-list";
import { TabsListSize } from "./tabs-list.props";

describe("<TabsList />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <Tabs>
        <TabsList />
      </Tabs>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <Tabs>
        <TabsList as={"aside"} />
      </Tabs>
    );

    expect(getByRole("tablist").nodeName.toLowerCase()).toEqual("aside");
  });

  it("passes size `md` to the context by default", () => {
    const { getByRole } = render_test_with_provider(
      <Tabs>
        <TabsList>
          <Tab value={"test"} />
        </TabsList>
      </Tabs>
    );

    expect(getByRole("tab")).toHaveClass(tab_styles.md);
  });

  (["lg", "md"] as TabsListSize[]).forEach((size) => {
    it(`passes \`${size}\` size to the context`, () => {
      const { getByRole } = render_test_with_provider(
        <Tabs>
          <TabsList size={size}>
            <Tab value={"test"} />
          </TabsList>
        </Tabs>
      );

      expect(getByRole("tab")).toHaveClass(tab_styles[size]);
    });
  });
});
