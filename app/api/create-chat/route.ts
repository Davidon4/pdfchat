import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';
import {db} from "@/db";
import { chats } from "@/db/schema";
import { getS3Url } from "@/lib/s3";
import {auth} from "@clerk/nextjs/server";
import axios from 'axios';

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    const {userId} = await auth();

    if (!userId) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    try {

        const {file_key, file_name} = await request.json();

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

        try {
            // Use absolute URL with environment variable
            const baseUrl = process.env.VERCEL_URL 
                ? `https://${process.env.VERCEL_URL}` 
                : `http://${process.env.NEXT_PUBLIC_BASE_URL}`;

            console.log('Attempting to call process-chat at:', `${baseUrl}/api/process-chat`);
            
            await axios.post(`${baseUrl}/api/process-chat`, {
                file_key, 
                chat_id: result[0].insertId
            });

            console.log('Successfully called process-chat');
        } catch (error: any) {
            console.error('Detailed error calling process-chat:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                url: error.config?.url
            });
        }

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