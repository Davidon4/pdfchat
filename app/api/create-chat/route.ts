import { loadS3IntoPinecone } from "@/lib/pinecone";
import { NextResponse } from "next/server";
import {db} from "@/db";
import { chats } from "@/db/schema";
import { getS3Url } from "@/lib/s3";
import {auth} from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function POST(req: Request, res: Response) {
    const {userId} = await auth();

    if (!userId) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    try {
        const body = await req.json();
        const {file_key, file_name} = body;
        console.log("FILES=>", file_key, file_name);
         await loadS3IntoPinecone(file_key);
        const result = await db
        .insert(chats)
        .values({
            fileKey: file_key,
            pdfName: file_name,
            pdfUrl: getS3Url(file_key),
            userId})
         .execute();

         const chat_id = result[0].insertId;
          return NextResponse.json(
            {
              chat_id
            },
            { status: 200 }
          );
    } catch (err) {
        console.error(err)
        return NextResponse.json({error: "internal server error"}, {status: 500})
    }
}