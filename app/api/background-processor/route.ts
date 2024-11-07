import { loadS3IntoPinecone } from "@/lib/pinecone";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";
import axios from "axios";

export const maxDuration = 60;
export const runtime = "nodejs";

const CHUNK_SIZE = 20; // Process 20 pages at a time

export async function POST(request: Request) {
    const { chat_id, file_key, startPage = 0 } = await request.json();
    
    try {
        // Modify loadS3IntoPinecone to accept page range
        const { hasMore } = await loadS3IntoPinecone(file_key, startPage, CHUNK_SIZE);
        
        if (hasMore) {
            // Schedule next chunk
            await axios.post('/api/background-processor', {
                chat_id,
                file_key,
                startPage: startPage + CHUNK_SIZE
            });
        } else {
            // Processing complete
            await db
                .update(chats)
                .set({ status: 'complete' })
                .where(eq(chats.id, chat_id))
                .execute();
        }
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Background processing error:', error);
        await db
            .update(chats)
            .set({ status: 'failed' })
            .where(eq(chats.id, chat_id))
            .execute();
            
        return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
}