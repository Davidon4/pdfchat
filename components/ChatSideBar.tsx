"use client";
import { DrizzleChat } from "@/db/schema";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  chats: DrizzleChat[];
  chatId: number;
  onChatSelect?: () => void;
};

const ChatSideBar = ({ chats, chatId, onChatSelect }: Props) => {

  return (
    <div className="w-full h-screen p-4 text-gray-200 bg-gray-900 flex flex-col">
      <Link href="/">
        <Button className="w-full border-dashed border-white border hover:bg-gray-700 transition-colors duration-200">
          <PlusCircle className="mr-2 w-4 h-4" />
          New Chat
        </Button>
      </Link>

      <div className="flex flex-col gap-2 mt-4 overflow-y-auto">
        {chats.map((chat) => (
          <Link key={chat.id} href={`/chat/${chat.id}`} onClick={onChatSelect}>
            <div
              className={cn("rounded-lg p-3 text-slate-300 flex items-center transition-colors duration-200", {
                "bg-blue-600 text-white": chat.id === chatId,
                "hover:bg-gray-700": chat.id !== chatId,
              })}
            >
              <MessageCircle className="mr-2 w-4 h-4" />
              <p className="w-full overflow-hidden text-sm truncate">
                {chat.pdfName || "New Chat"}
              </p>
              {chat.status === 'processing' && (
                <span className="text-xs text-yellow-500 ml-2">(Processing...)</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ChatSideBar;
