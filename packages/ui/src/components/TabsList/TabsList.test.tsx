import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Tab from "../Tab";
import tabStyles from "../Tab/Tab.module.scss";
import Tabs from "../Tabs";
import TabsList from "./TabsList";
import { TabsListSize } from "./TabsList.props";

describe("<TabsList />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <Tabs>
        <TabsList />
      </Tabs>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(
      <Tabs>
        <TabsList as={"aside"} />
      </Tabs>
    );

    expect(getByRole("tablist").nodeName.toLowerCase()).toEqual("aside");
  });

  it("passes size `md` to the context by default", () => {
    const { getByRole } = renderTestWithProvider(
      <Tabs>
        <TabsList>
          <Tab value={"test"} />
        </TabsList>
      </Tabs>
    );

    expect(getByRole("tab")).toHaveClass(tabStyles.md);
  });

  (["lg", "md"] as TabsListSize[]).forEach((size) => {
    it(`passes \`${size}\` size to the context`, () => {
      const { getByRole } = renderTestWithProvider(
        <Tabs>
          <TabsList size={size}>
            <Tab value={"test"} />
          </TabsList>
        </Tabs>
      );

      expect(getByRole("tab")).toHaveClass(tabStyles[size]);
    });
  });
});
