import { GetObjectCommand } from "@aws-sdk/client-s3";
import { redirect } from "next/navigation";

import { s3Client } from "~/common/client/s3";

/**
 * Returns the binary data of a document stored in s3
 * @param key Key of the document
 */
export const getDocByKey = async (key: string): Promise<Uint8Array> => {
  const response = await s3Client.send(
    new GetObjectCommand({
      Key: key,
      Bucket: "docs"
    })
  );

  if (!response.Body) {
    // Although this should never happen in practice, let's handle the missing
    // document file by returning a gateway error to the client.
    redirect("/gateway-error");
  }

  return await response.Body.transformToByteArray();
};
