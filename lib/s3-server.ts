import {S3} from "@aws-sdk/client-s3"
import fs from "fs";

export const s3Client = new S3({
    region: process.env.NEXT_PUBLIC_S3_REGION, // Change to your region
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
    },
  });

export async function downloadFromS3(file_key: string) {
    try {

        const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
            
          if (!BUCKET_NAME) {
            throw new Error("S3 bucket name is not defined");
          }

        const params = {
            Bucket: BUCKET_NAME,
            Key: file_key,
        };

        const obj = await s3Client.getObject(params);
        const file_name = `/tmp/${Date.now()}.pdf`;

    if (obj.Body) {
      const file_data = await obj.Body.transformToByteArray();
      fs.writeFileSync(file_name, Buffer.from(file_data));
      return file_name;
    }
    } catch (error) {
      console.error(error);
      return null;
    }
  }