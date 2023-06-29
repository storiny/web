import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Modal from "../Modal";
import { ModalHeaderProps } from "./Header.props";

describe("<ModalHeader />", () => {
  it("matches snapshot", () => {
    const { baseElement } = renderTestWithProvider(
      <Modal
        open
        slotProps={{
          header: { children: "Test" },
        }}
      />
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = renderTestWithProvider(
      <Modal
        open
        slotProps={{
          header: { children: "Test" },
        }}
      />
    );

    await waitFor(async () =>
      expect(await axe(baseElement)).toHaveNoViolations()
    );
  });

  it("renders decorator and children", () => {
    const { getByTestId } = renderTestWithProvider(
      <Modal
        open
        slotProps={{
          header: {
            decorator: <span data-testid={"decorator"} />,
            children: <span data-testid={"child"} />,
          },
        }}
      />
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Modal
        open
        slotProps={{
          header: {
            children: "Test",
            decorator: <span />,
            slotProps: {
              decorator: { "data-testid": "decorator" },
              title: { "data-testid": "title" },
            } as ModalHeaderProps["slotProps"],
          },
        }}
      />
    );

    ["decorator", "title"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
