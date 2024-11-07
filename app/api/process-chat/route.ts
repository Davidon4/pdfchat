import { loadS3IntoPinecone } from "@/lib/pinecone";
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';
import {db} from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";

export const maxDuration = 300;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    let body;
    try {
        body = await request.json();
        const {file_key, chat_id} = body;
        
        await loadS3IntoPinecone(file_key);
        
        // Update chat status to complete
        await db
            .update(chats)
            .set({ status: 'complete' })
            .where(eq(chats.id, chat_id))
            .execute();

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
        console.error(err);
        
        // Update chat status to failed
        if (body?.chat_id) {
            await db
                .update(chats)
                .set({ status: 'failed' })
                .where(eq(chats.id, body.chat_id))
                .execute();
        }
        
        return NextResponse.json({error: "internal server error"}, {status: 500});
    }
}