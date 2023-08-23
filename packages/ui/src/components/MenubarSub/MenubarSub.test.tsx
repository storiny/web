import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Menubar from "../Menubar";
import MenubarItem from "../MenubarItem";
import MenubarMenu from "../MenubarMenu";
import MenubarSub from "./MenubarSub";
import { MenubarSubProps } from "./MenubarSub.props";

describe("<MenubarSub />", () => {
  it("matches snapshot", () => {
    const { baseElement } = renderTestWithProvider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarSub open trigger={<button>Trigger</button>}>
            <MenubarItem>Submenu item</MenubarItem>
          </MenubarSub>
        </MenubarMenu>
      </Menubar>
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = renderTestWithProvider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarSub open trigger={<button>Trigger</button>}>
            <MenubarItem>Submenu item</MenubarItem>
          </MenubarSub>
        </MenubarMenu>
      </Menubar>
    );

    await waitFor(async () =>
      expect(
        await axe(baseElement, {
          rules: {
            region: { enabled: false },
            "aria-allowed-attr": { enabled: false }
          }
        })
      ).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarSub
            as={"aside"}
            open
            slotProps={
              {
                content: { "data-testid": "content" }
              } as MenubarSubProps["slotProps"]
            }
            trigger={<button>Trigger</button>}
          >
            <MenubarItem>Submenu item</MenubarItem>
          </MenubarSub>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByTestId("content").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders trigger", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarSub open trigger={<span data-testid={"trigger"} />}>
            <MenubarItem>Submenu item</MenubarItem>
          </MenubarSub>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByTestId("trigger")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarSub
            open
            slotProps={
              {
                content: { "data-testid": "content" },
                trigger: { "data-testid": "trigger" }
              } as MenubarSubProps["slotProps"]
            }
            trigger={<button>Trigger</button>}
          >
            <MenubarItem>Submenu item</MenubarItem>
          </MenubarSub>
        </MenubarMenu>
      </Menubar>
    );

    ["content", "trigger"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
