import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Tab from "../tab";
import Tabs from "../tabs";
import TabsList from "../tabs-list";
import TabPanel from "./tab-panel";

describe("<TabPanel />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <Tabs>
        <TabsList>
          <Tab value={"test"} />
        </TabsList>
        <TabPanel value={"test"} />
      </Tabs>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Tabs>
        <TabsList>
          <Tab value={"test"}>Test</Tab>
        </TabsList>
        <TabPanel value={"test"} />
      </Tabs>
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <Tabs defaultValue={"test"}>
        <TabsList>
          <Tab value={"test"} />
        </TabsList>
        <TabPanel as={"aside"} value={"test"} />
      </Tabs>
    );

    expect(getByRole("tabpanel").nodeName.toLowerCase()).toEqual("aside");
  });
});
