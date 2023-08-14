import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Accordion, {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "./Accordion";
import {
  AccordionContentProps,
  AccordionTriggerProps
} from "./Accordion.props";

describe("<Accordion />", () => {
  it("matches snapshot for `single` type", () => {
    const { container } = renderTestWithProvider(
      <Accordion collapsible defaultValue={"test"} type={"single"}>
        <AccordionItem value="test">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot for `multiple` type", () => {
    const { container } = renderTestWithProvider(
      <Accordion defaultValue={["test"]} type={"multiple"}>
        <AccordionItem value="test">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations for `single` type", async () => {
    const { container } = renderTestWithProvider(
      <Accordion collapsible defaultValue={"test"} type={"single"}>
        <AccordionItem value="test">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations for `multiple` type", async () => {
    const { container } = renderTestWithProvider(
      <Accordion defaultValue={["test"]} type={"multiple"}>
        <AccordionItem value="test">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Accordion
        as={"aside"}
        collapsible
        data-testid={"accordion"}
        defaultValue={"test"}
        type={"single"}
      >
        <AccordionItem as={"aside"} data-testid={"item"} value="test">
          <AccordionTrigger
            as={"aside"}
            data-testid={"trigger"}
            slotProps={
              {
                header: {
                  as: "aside",
                  "data-testid": "header"
                }
              } as AccordionTriggerProps["slotProps"]
            }
          >
            Trigger
          </AccordionTrigger>
          <AccordionContent as={"aside"} data-testid={"content"}>
            Content
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    ["accordion", "item", "trigger", "header", "content"].forEach((id) => {
      expect(getByTestId(id).nodeName.toLowerCase()).toEqual("aside");
    });
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Accordion collapsible defaultValue={"test"} type={"single"}>
        <AccordionItem data-testid={"item"} value="test">
          <AccordionTrigger
            slotProps={
              {
                header: { "data-testid": "header" },
                icon: { "data-testid": "icon" }
              } as AccordionTriggerProps["slotProps"]
            }
          >
            Trigger
          </AccordionTrigger>
          <AccordionContent
            slotProps={
              {
                wrapper: {
                  "data-testid": "wrapper"
                }
              } as AccordionContentProps["slotProps"]
            }
          >
            Content
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    ["header", "item", "wrapper"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
