import { loadS3IntoPinecone } from "@/lib/pinecone";
import { NextResponse } from "next/server";
import {db} from "@/db";
import { chats } from "@/db/schema";
import { getS3Url } from "@/lib/s3";

export async function POST(req: Request, res: Response) {
    try {
        const body = await req.json();
        const {file_key, file_name} = body;
        console.log("FILES=>", file_key, file_name);
         await loadS3IntoPinecone(file_key);
         await db.insert(chats).values({fileKey: file_key, pdfName: file_name, pdfUrl: getS3Url(file_key)})
    } catch (err) {
        console.error(err)
        return NextResponse.json({error: "internal server error"}, {status: 500})
    }
}