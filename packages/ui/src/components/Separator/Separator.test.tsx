import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Menu from "../Menu";
import Separator from "../Separator";

describe("<Separator />", () => {
  it("matches snapshot", () => {
    const { baseElement } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <Separator />
      </Menu>
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("renders with inverted margin", () => {
    const { baseElement } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <Separator invertMargin />
      </Menu>
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <Separator />
      </Menu>
    );

    await waitFor(async () =>
      expect(
        await axe(baseElement, {
          rules: {
            region: { enabled: false },
            "aria-required-children": { enabled: false }
          }
        })
      ).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <Separator as={"aside"} />
      </Menu>
    );

    expect(getByRole("separator").nodeName.toLowerCase()).toEqual("aside");
  });
});
