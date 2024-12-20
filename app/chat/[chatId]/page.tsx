import React from "react";
import { auth } from "@clerk/nextjs/server";
import {redirect} from "next/navigation";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";
import ChatSideBar from "@/components/ChatSideBar";
import ChatComponent from "@/components/ChatComponent";

type Props = {
    params: {
        chatId: string;
        }
}

export default async function ChatPage ({params}: Props) {
    const {chatId} = params;
    const {userId} = await auth();

    if(!userId) {
        return redirect("/sign-in")
    }
    const _chats = await db.select().from(chats).where(eq(chats.userId, userId))
    if (!_chats) {
        return redirect("/")
      }
      if (!_chats.find((chat) => chat.id === parseInt(chatId))) {
        return redirect("/")
      }

    return (
      <div className="flex max-h-screen overflow-hidden">
        {/* Sidebar */}
        <div
          className="w-full md:w-[300px] md:flex-shrink-0 h-full overflow-y-auto border-r border-gray-200 
          bg-white transition-all duration-300 ease-in-out"
        >
          <ChatSideBar chats={_chats} chatId={parseInt(chatId)} />
        </div>
        {/* Main chat area */}
        <div className="flex-1 h-screen overflow-hidden">
          <ChatComponent chatId={parseInt(chatId)} />
        </div>
      </div>
    )
}