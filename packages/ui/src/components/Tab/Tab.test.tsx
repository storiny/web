import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Tabs from "../Tabs";
import TabsList from "../TabsList";
import Tab from "./Tab";
import styles from "./Tab.module.scss";
import { TabProps, TabSize } from "./Tab.props";

describe("<Tab />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <Tabs>
        <TabsList>
          <Tab value={"test"} />
        </TabsList>
      </Tabs>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(
      <Tabs>
        <TabsList>
          <Tab as={"aside"} value={"test"} />
        </TabsList>
      </Tabs>
    );

    expect(getByRole("tab").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders size `md` by default", () => {
    const { getByRole } = renderTestWithProvider(
      <Tabs>
        <TabsList>
          <Tab value={"test"} />
        </TabsList>
      </Tabs>
    );

    expect(getByRole("tab")).toHaveClass(styles.md);
  });

  (["lg", "md"] as TabSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = renderTestWithProvider(
        <Tabs>
          <TabsList>
            <Tab size={size} value={"test"} />
          </TabsList>
        </Tabs>
      );

      expect(getByRole("tab")).toHaveClass(styles[size]);
    });
  });

  it("infers size from TabsList context", () => {
    const { getByRole } = renderTestWithProvider(
      <Tabs>
        <TabsList size={"lg"}>
          <Tab value={"test"} />
        </TabsList>
      </Tabs>
    );

    expect(getByRole("tab")).toHaveClass(styles.lg);
  });

  it("renders children", () => {
    const { getByTestId } = renderTestWithProvider(
      <Tabs>
        <TabsList>
          <Tab value={"test"}>
            <span data-testid={"tab-child"} />
          </Tab>
        </TabsList>
      </Tabs>
    );

    expect(getByTestId("tab-child")).toBeInTheDocument();
  });

  it("renders decorator", () => {
    const { getByTestId } = renderTestWithProvider(
      <Tabs>
        <TabsList>
          <Tab decorator={<span data-testid={"decorator"} />} value={"test"}>
            Test
          </Tab>
        </TabsList>
      </Tabs>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("renders decorator in the root slot when children are absent", () => {
    const { getByRole } = renderTestWithProvider(
      <Tabs>
        <TabsList>
          <Tab decorator={<span data-test="" />} value={"test"} />
        </TabsList>
      </Tabs>
    );

    expect(getByRole("tab").firstChild).toHaveAttribute("data-test", "");
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Tabs>
        <TabsList>
          <Tab
            decorator={<span />}
            slotProps={
              {
                decorator: { "data-testid": "decorator" },
              } as TabProps["slotProps"]
            }
            value={"test"}
          >
            Test
          </Tab>
        </TabsList>
      </Tabs>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });
});
