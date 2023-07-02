import { zodResolver } from "@hookform/resolvers/zod";
import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";
import { z } from "zod";

import Form, { useForm } from "~/components/Form";
import { renderTestWithProvider } from "~/redux/testUtils";

import FormTextarea from "./FormTextarea";
import { FormTextareaProps } from "./FormTextarea.props";

const testSchema = z.object({
  textarea: z.string()
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
      textarea: ""
    }
  });

  return (
    <Form disabled={disabled} providerProps={form}>
      {children}
    </Form>
  );
};

describe("<FormTextarea />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <Component>
        <FormTextarea label={"Test label"} name={"textarea"} />
      </Component>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Component>
        <FormTextarea label={"Test label"} name={"textarea"} />
      </Component>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("consumes disabled prop from `FormContext`", () => {
    const { getByTestId } = renderTestWithProvider(
      <Component disabled>
        <FormTextarea
          formSlotProps={
            {
              formItem: { "data-testid": "form-item" }
            } as FormTextareaProps["formSlotProps"]
          }
          label={"Test label"}
          name={"textarea"}
        />
      </Component>
    );

    expect(getByTestId("form-item")).toHaveAttribute("data-disabled", "true");
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Component>
        <FormTextarea
          formSlotProps={
            {
              formItem: { "data-testid": "form-item" },
              control: { "data-testid": "control" },
              label: { "data-testid": "label" },
              helperText: { "data-testid": "helper-text" }
            } as FormTextareaProps["formSlotProps"]
          }
          helperText={"Test helper text"}
          label={"Test label"}
          name={"textarea"}
        />
      </Component>
    );

    ["form-item", "control", "label", "helper-text"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
