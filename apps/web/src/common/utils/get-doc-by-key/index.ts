import { GetObjectCommand } from "@aws-sdk/client-s3";
import { captureException as capture_exception } from "@sentry/nextjs";

import { get_s3_client } from "~/common/client/s3";

/**
 * Returns the binary data of a document stored in S3
 * @param key Key of the document
 */
export const get_doc_by_key = async (key: string): Promise<Uint8Array> => {
  const response = await get_s3_client().send(
    new GetObjectCommand({
      Key: key,
      Bucket: "docs-84b42278"
    })
  );

  if (!response.Body) {
    capture_exception(`[s3]: response does not have a body with key: ${key}`);
    // Although this should never happen in practice, let's handle the missing
    // document file by returning a gateway error to the client.
    throw new Error("gateway_error");
  }

  return await response.Body.transformToByteArray();
};
