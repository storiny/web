import { axe } from "@storiny/test-utils";
import React from "react";
import { z } from "zod";

import Form, { use_form } from "~/components/form";
import { render_test_with_provider } from "~/redux/test-utils";

import { zod_resolver } from "../form";
import FormCheckbox from "./form-checkbox";
import { FormCheckboxProps } from "./form-checkbox.props";

const test_schema = z.object({
  checkbox: z.boolean()
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
      checkbox: false
    }
  });

  return (
    <Form disabled={disabled} provider_props={form}>
      {children}
    </Form>
  );
};

describe("<FormCheckbox />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <Component>
        <FormCheckbox label={"Test label"} name={"checkbox"} />
      </Component>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Component>
        <FormCheckbox label={"Test label"} name={"checkbox"} />
      </Component>
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("consumes disabled prop from `FormContext`", () => {
    const { getByTestId } = render_test_with_provider(
      <Component disabled>
        <FormCheckbox
          form_slot_props={
            {
              form_item: { "data-testid": "form-item" }
            } as FormCheckboxProps["form_slot_props"]
          }
          label={"Test label"}
          name={"checkbox"}
        />
      </Component>
    );

    expect(getByTestId("form-item")).toHaveAttribute("data-disabled", "true");
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Component>
        <FormCheckbox
          form_slot_props={
            {
              form_item: { "data-testid": "form-item" },
              control: { "data-testid": "control" },
              label: { "data-testid": "label" },
              helper_text: { "data-testid": "helper-text" }
            } as FormCheckboxProps["form_slot_props"]
          }
          helper_text={"Test helper text"}
          label={"Test label"}
          name={"checkbox"}
        />
      </Component>
    );

    ["form-item", "control", "label", "helper-text"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
