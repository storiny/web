import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Tabs from "../tabs";
import TabsList from "../tabs-list";
import Tab from "./tab";
import styles from "./tab.module.scss";
import { TabProps, TabSize } from "./tab.props";

describe("<Tab />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <Tabs>
        <TabsList>
          <Tab value={"test"} />
        </TabsList>
      </Tabs>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <Tabs>
        <TabsList>
          <Tab as={"aside"} value={"test"} />
        </TabsList>
      </Tabs>
    );

    expect(getByRole("tab").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders size `md` by default", () => {
    const { getByRole } = render_test_with_provider(
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
      const { getByRole } = render_test_with_provider(
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
    const { getByRole } = render_test_with_provider(
      <Tabs>
        <TabsList size={"lg"}>
          <Tab value={"test"} />
        </TabsList>
      </Tabs>
    );

    expect(getByRole("tab")).toHaveClass(styles.lg);
  });

  it("renders children", () => {
    const { getByTestId } = render_test_with_provider(
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
    const { getByTestId } = render_test_with_provider(
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
    const { getByRole } = render_test_with_provider(
      <Tabs>
        <TabsList>
          <Tab decorator={<span data-test="" />} value={"test"} />
        </TabsList>
      </Tabs>
    );

    expect(getByRole("tab").firstChild).toHaveAttribute("data-test", "");
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Tabs>
        <TabsList>
          <Tab
            decorator={<span />}
            slot_props={
              {
                decorator: { "data-testid": "decorator" }
              } as TabProps["slot_props"]
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
