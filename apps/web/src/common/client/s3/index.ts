import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  },
  endpoint:
    process.env.NODE_ENV === "development"
      ? "http://localhost:9000"
      : undefined,
  forcePathStyle: true,
  region: process.env.AWS_REGION
});
