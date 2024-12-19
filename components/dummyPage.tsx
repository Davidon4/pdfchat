// Use "use client" only in client components
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";
import ChatPageClient from "@/components/ChatPageClient";

type Props = {
  params: {
    chatId: string;
  };
};

export default async function ChatPage({ params }: Props) {
  const { chatId } = params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const _chats = await db.select().from(chats).where(eq(chats.userId, userId));

    // Ensure _chats contains the correct structure
    const formattedChats = _chats.map((chat) => ({
      id: chat.id,
      pdfName: chat.pdfName,
      pdfUrl: chat.pdfUrl,
      createdAt: chat.createdAt,
      userId: chat.userId,
      fileKey: chat.fileKey,
      status: chat.status,
    }));

  if (!_chats || !formattedChats.find((chat) => chat.id === parseInt(chatId))) {
    redirect("/");
  }

  return (
    <ChatPageClient chats={formattedChats} chatId={parseInt(chatId)} />
  );
}
