import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Tab from "../Tab";
import Tabs from "../Tabs";
import TabsList from "../TabsList";
import TabPanel from "./TabPanel";

describe("<TabPanel />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
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
    const { container } = renderTestWithProvider(
      <Tabs>
        <TabsList>
          <Tab value={"test"}>Test</Tab>
        </TabsList>
        <TabPanel value={"test"} />
      </Tabs>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(
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
