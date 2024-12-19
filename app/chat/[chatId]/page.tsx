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
        return redirect("/");
      }
      if (!_chats.find((chat) => chat.id === parseInt(chatId))) {
        return redirect("/");
      }

    return (
      <div className="flex flex-col h-screen md:flex-row">
        <div
        className={`md:block md:flex-[1] md:max-w-xs h-full overflow-y-auto transition-all duration-300 ease-in-out`}
      >
          <ChatSideBar chats={_chats} chatId={parseInt(chatId)} />
        </div>
        {/* chat component */}
        <div className="flex-[3] h-full overflow-y-auto border-l border-l-slate-200">
          <ChatComponent chatId={parseInt(chatId)} />
        </div>
      </div>
    )
}