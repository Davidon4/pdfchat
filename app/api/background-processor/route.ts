import { loadS3IntoPinecone } from "@/lib/pinecone";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";
import axios from "axios";
import { auth } from "@clerk/nextjs/server";

export const maxDuration = 60;
export const runtime = "nodejs";

const CHUNK_SIZE = 20; // Process 20 pages at a time

export async function POST(request: Request) {
    console.log('Background processor started');

    const { userId } = await auth();
    if (!userId) {
        console.log('Unauthorized access attempt in background processor');
        return NextResponse.json({error: "unauthorized"}, {status: 401});
    }

    const { chat_id, file_key, startPage = 0 } = await request.json();
    console.log('Processing chunk:', { chat_id, file_key, startPage });
    
    try {
        const { hasMore } = await loadS3IntoPinecone(file_key, startPage, CHUNK_SIZE);
        console.log('Chunk processing result:', { hasMore, startPage });
        
        if (hasMore) {
            const baseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : `http://${process.env.NEXT_PUBLIC_BASE_URL}`;
            
        console.log('Calling next chunk at:', `${baseUrl}/api/background-processor`)

            await axios.post(`${baseUrl}/api/background-processor`, {
                chat_id,
                file_key,
                startPage: startPage + CHUNK_SIZE
            });
        } else {
            console.log('Processing complete, updating status');
            await db
                .update(chats)
                .set({ status: 'complete' })
                .where(eq(chats.id, chat_id))
                .execute();
        }
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Detailed background processing error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        await db
            .update(chats)
            .set({ status: 'failed' })
            .where(eq(chats.id, chat_id))
            .execute();
            
        return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
}