import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';
import {db} from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";
import axios from "axios";
import { auth } from "@clerk/nextjs/server";
export const runtime = "nodejs";


export async function POST(request: NextRequest) {
    const {userId} = await auth();

    if (!userId) {
        return NextResponse.json({error: "unauthorized"}, {status: 401});
    }

    try {
        const {file_key, chat_id} = await request.json();
        console.log('Starting process-chat with:', { file_key, chat_id });
        
        // Update chat status to processing
        await db
            .update(chats)
            .set({ status: 'processing', fileKey: file_key })
            .where(eq(chats.id, chat_id))
            .execute();

            // Use absolute URL with protocol
            const baseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : `https://${process.env.NEXT_PUBLIC_BASE_URL}`;
                
            console.log('Calling background-processor at:', `${baseUrl}/api/background-processor`);
            console.log("vercel url=>", process.env.VERCEL_URL)
            console.log("Next public url=>", process.env.NEXT_PUBLIC_BASE_URL)

        // Use absolute URL with environment variable
        const response = await axios.post(`${baseUrl}/api/background-processor`, {
            chat_id,
            file_key,
        });
        
        console.log('Background processor response:', response.data);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: any) {
        console.error('Detailed error in process-chat:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status
        });     
        return NextResponse.json({error: "internal server error"}, {status: 500});
    }
}