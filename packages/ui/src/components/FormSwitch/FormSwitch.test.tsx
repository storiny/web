import { zodResolver } from "@hookform/resolvers/zod";
import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";
import { z } from "zod";

import Form, { useForm } from "~/components/Form";
import { render_test_with_provider } from "src/redux/test-utils";

import FormSwitch from "./FormSwitch";
import { FormSwitchProps } from "./FormSwitch.props";

const testSchema = z.object({
  switch: z.boolean()
});

type TestSchema = z.infer<typeof testSchema>;

const Component = ({
  children,
  disabled
}: {
  children: React.ReactNode;
  disabled?: boolean;
}): React.ReactElement => {
  const form = useForm<TestSchema>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      switch: false
    }
  });

  return (
    <Form disabled={disabled} providerProps={form}>
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

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("consumes disabled prop from `FormContext`", () => {
    const { getByTestId } = render_test_with_provider(
      <Component disabled>
        <FormSwitch
          formSlotProps={
            {
              formItem: {
                "data-testid": "form-item"
              }
            } as FormSwitchProps["formSlotProps"]
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
          formSlotProps={
            {
              formItem: { "data-testid": "form-item" },
              control: { "data-testid": "control" },
              label: { "data-testid": "label" },
              helperText: { "data-testid": "helper-text" }
            } as FormSwitchProps["formSlotProps"]
          }
          helperText={"Test helper text"}
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
