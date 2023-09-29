import React from "react";

import Link from "../../../../../../packages/ui/src/components/link";

import ErrorLayout from "../../(error)/layout";

const ERROR_CODE = 504;

const Error504Page = (): React.ReactElement => (
  <ErrorLayout
    description={
      <>
        Storiny is currently unavailable. Please try again later or check our{" "}
        {
          <Link href={"/status"} underline={"always"}>
            service status
          </Link>
        }{" "}
        for any updates.
      </>
    }
    errorCode={`${ERROR_CODE}`}
    title={"Gateway timeout"}
  />
);

export default Error504Page;
