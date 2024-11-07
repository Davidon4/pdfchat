import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';
import {db} from "@/db";
import { chats } from "@/db/schema";
import { getS3Url } from "@/lib/s3";
import {auth} from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    const {userId} = await auth();

    if (!userId) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    try {
        const body = await request.json();
        const {file_key, file_name} = body;

        const result = await db
        .insert(chats)
        .values({
            fileKey: file_key,
            pdfName: file_name,
            pdfUrl: getS3Url(file_key),
            userId,
          status: 'processing'
        })
          .returning({insertId: chats.id})
         .execute();

         fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/process-chat`, {
            method: "POST",
            body: JSON.stringify({file_key, chat_id: result[0].insertId})
         })

          return NextResponse.json(
            {
              chat_id: result[0].insertId
            },
            { status: 200 }
          );
    } catch (err) {
        console.error(err)
        return NextResponse.json({error: "internal server error"}, {status: 500})
    }
}