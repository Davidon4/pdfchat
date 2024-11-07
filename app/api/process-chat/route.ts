import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';
import {db} from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";
import axios from "axios";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    let body;
    try {
        const {file_key, chat_id} = await request.json();
        
        // Update chat status to complete
        await db
            .update(chats)
            .set({ status: 'processing', fileKey: file_key })
            .where(eq(chats.id, chat_id))
            .execute();

            await axios.post('/api/background-processor', {
                chat_id,
                file_key,
            });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
        console.error(err);     
        return NextResponse.json({error: "internal server error"}, {status: 500});
    }
}