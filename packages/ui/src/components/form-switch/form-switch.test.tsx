import { zod_resolver } from "../form";
import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";
import { z } from "zod";

import Form, { use_form } from "src/components/form";
import { render_test_with_provider } from "src/redux/test-utils";

import FormSwitch from "./form-switch";
import { FormSwitchProps } from "./form-switch.props";

const test_schema = z.object({
  switch: z.boolean()
});

type TestSchema = z.infer<typeof test_schema>;

const Component = ({
  children,
  disabled
}: {
  children: React.ReactNode;
  disabled?: boolean;
}): React.ReactElement => {
  const form = use_form<TestSchema>({
    resolver: zod_resolver(test_schema),
    defaultValues: {
      switch: false
    }
  });

  return (
    <Form disabled={disabled} provider_props={form}>
      {children}
    </Form>
  );
};

describe("<FormSwitch />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <Component>
        <FormSwitch
          aria-label={"Sample switch"}
          label={"Test label"}
          name={"switch"}
        />
      </Component>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Component>
        <FormSwitch
          aria-label={"Sample switch"}
          label={"Test label"}
          name={"switch"}
        />
      </Component>
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("consumes disabled prop from `FormContext`", () => {
    const { getByTestId } = render_test_with_provider(
      <Component disabled>
        <FormSwitch
          form_slot_props={
            {
              form_item: {
                "data-testid": "form-item"
              }
            } as FormSwitchProps["form_slot_props"]
          }
          label={"Test label"}
          name={"switch"}
        />
      </Component>
    );

    expect(getByTestId("form-item")).toHaveAttribute("data-disabled", "true");
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Component>
        <FormSwitch
          aria-label={"Sample switch"}
          form_slot_props={
            {
              form_item: { "data-testid": "form-item" },
              control: { "data-testid": "control" },
              label: { "data-testid": "label" },
              helper_text: { "data-testid": "helper-text" }
            } as FormSwitchProps["form_slot_props"]
          }
          helper_text={"Test helper text"}
          label={"Test label"}
          name={"switch"}
        />
      </Component>
    );

    ["form-item", "control", "label", "helper-text"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
