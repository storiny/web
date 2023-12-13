import { axe } from "@storiny/test-utils";
import React from "react";
import { z } from "zod";

import Form, { use_form } from "~/components/form";
import { render_test_with_provider } from "~/redux/test-utils";

import { zod_resolver } from "../form";
import FormPasswordInput from "./form-password-input";

const test_schema = z.object({
  input: z.string()
});

type TestSchema = z.infer<typeof test_schema>;

const Component = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const form = use_form<TestSchema>({
    resolver: zod_resolver(test_schema),
    defaultValues: {
      input: ""
    }
  });

  return <Form provider_props={form}>{children}</Form>;
};

describe("<FormPasswordInput />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <Component>
        <FormPasswordInput label={"Test label"} name={"input"} />
      </Component>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Component>
        <FormPasswordInput label={"Test label"} name={"input"} />
      </Component>
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
