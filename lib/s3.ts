import { S3 } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

export const s3Client = new S3({
    region: process.env.NEXT_PUBLIC_S3_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
    },
});

export async function uploadToS3(file: File) {
    try {

        const file_key = 'uploads/' + Date.now().toString() + file.name.replace(" ", "-");

        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
                Key: file_key,
                Body: file,
            },
        });

        // Optional: Track upload progress
        upload.on("httpUploadProgress", (progress) => {
            console.log(
                "uploading to s3...",
                Math.round((progress.loaded! / progress.total!) * 100) + "%"
            );
        });

        await upload.done();
        console.log("successfully uploaded to s3!", file_key);

        return {
            file_key,
            file_name: file.name
        };
    } catch (error) {
        console.error("Error uploading to S3:", error);
        throw error;
    }
}

export function getS3Url(file_key: string) {
    const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
    return `https://${BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${file_key}`;
  }