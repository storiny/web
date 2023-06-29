import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Menu from "../Menu";
import Separator from "../Separator";

describe("<Separator />", () => {
  it("matches snapshot", () => {
    const { baseElement } = renderTestWithProvider(
      <Menu open trigger={<button>Trigger</button>}>
        <Separator />
      </Menu>
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = renderTestWithProvider(
      <Menu open trigger={<button>Trigger</button>}>
        <Separator />
      </Menu>
    );

    await waitFor(async () =>
      expect(
        await axe(baseElement, {
          rules: {
            region: { enabled: false },
            "aria-required-children": { enabled: false },
          },
        })
      ).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(
      <Menu open trigger={<button>Trigger</button>}>
        <Separator as={"aside"} />
      </Menu>
    );

    expect(getByRole("separator").nodeName.toLowerCase()).toEqual("aside");
  });
});
