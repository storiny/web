import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { ModalSidebarItemProps } from "~/components/Modal";
import { render_test_with_provider } from "src/redux/test-utils";

import Tabs from "../../Tabs";
import ModalSidebarList from "../SidebarList";
import ModalSidebarItem from "./SidebarItem";

describe("<ModalSidebarItem />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <Tabs>
        <ModalSidebarList>
          <ModalSidebarItem value={"test"}>Test</ModalSidebarItem>
        </ModalSidebarList>
      </Tabs>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
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
    const { getByTestId } = render_test_with_provider(
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
    const { getByTestId } = render_test_with_provider(
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
    const { getByTestId } = render_test_with_provider(
      <Tabs>
        <ModalSidebarList>
          <ModalSidebarItem
            decorator={<span />}
            slot_props={
              {
                decorator: { "data-testid": "decorator" }
              } as ModalSidebarItemProps["slot_props"]
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
