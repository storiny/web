import NextLink from "next/link";
import React from "react";

import Button from "~/components/button";

import ErrorLayout from "../../(error)/layout";

const ERROR_CODE = 404;

const Error404Page = (): React.ReactElement => (
  <ErrorLayout
    description={`Well, this is awkward... It seems like the page you were hoping to find is not available. We suggest double-checking the address you entered, or using our search bar to find what you're looking for.`}
    enable_search
    error_code={`${ERROR_CODE}`}
    title={"Page not found"}
  >
    <Button as={NextLink} href={"/"} size={"lg"}>
      Return to home
    </Button>
  </ErrorLayout>
);

export default Error404Page;
