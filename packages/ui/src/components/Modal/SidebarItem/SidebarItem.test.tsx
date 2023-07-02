import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { ModalSidebarItemProps } from "~/components/Modal";
import { renderTestWithProvider } from "~/redux/testUtils";

import Tabs from "../../Tabs";
import ModalSidebarList from "../SidebarList";
import ModalSidebarItem from "./SidebarItem";

describe("<ModalSidebarItem />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <Tabs>
        <ModalSidebarList>
          <ModalSidebarItem value={"test"}>Test</ModalSidebarItem>
        </ModalSidebarList>
      </Tabs>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Tabs>
        <ModalSidebarList>
          <ModalSidebarItem value={"test"}>Test</ModalSidebarItem>
        </ModalSidebarList>
      </Tabs>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders children", () => {
    const { getByTestId } = renderTestWithProvider(
      <Tabs>
        <ModalSidebarList>
          <ModalSidebarItem value={"test"}>
            <span data-testid={"sidebar-item-child"} />
          </ModalSidebarItem>
        </ModalSidebarList>
      </Tabs>
    );

    expect(getByTestId("sidebar-item-child")).toBeInTheDocument();
  });

  it("renders decorator", () => {
    const { getByTestId } = renderTestWithProvider(
      <Tabs>
        <ModalSidebarList>
          <ModalSidebarItem
            decorator={<span data-testid={"decorator"} />}
            value={"test"}
          >
            Test
          </ModalSidebarItem>
        </ModalSidebarList>
      </Tabs>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Tabs>
        <ModalSidebarList>
          <ModalSidebarItem
            decorator={<span />}
            slotProps={
              {
                decorator: { "data-testid": "decorator" }
              } as ModalSidebarItemProps["slotProps"]
            }
            value={"test"}
          >
            Test
          </ModalSidebarItem>
        </ModalSidebarList>
      </Tabs>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });
});
