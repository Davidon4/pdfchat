import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {

  const { userId } = await auth();
  if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const chatId = parseInt(params.chatId);
    console.log("Chat ID:", chatId);
    const chat = await db.select().from(chats).where(eq(chats.id, chatId));

    if (!chat || chat.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ status: chat[0].status });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}