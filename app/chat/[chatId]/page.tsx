"use client"
import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {redirect} from "next/navigation";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";
import ChatSideBar from "@/components/ChatSideBar";
import ChatComponent from "@/components/ChatComponent";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
    params: {
        chatId: string;
        }
}

const ChatPage = ({params}: Props) => {
    const [showSidebar, setShowSidebar] = useState(false);
    const [chatsData, setChatsData] = useState<any[]>([]);
    const {chatId} = params;
    const { userId } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if(!userId) {
            console.log("No userId found");
            redirect("/sign-in");
            return;
        }

        const fetchChats = async () => {
            try {
                console.log("Fetching chats for userId:", userId);
                const _chats = await db.select().from(chats).where(eq(chats.userId, userId));
                console.log("Fetched chats:", _chats);
                
                if (!_chats || _chats.length === 0) {
                    console.log("No chats found for user");
                    setChatsData([]);
                    return;
                }

                setChatsData(_chats);
                
                if (!_chats.find((chat) => chat.id === parseInt(chatId))) {
                    console.log("No matching chat found for chatId:", chatId);
                    redirect("/");
                }
            } catch (error) {
                console.error("Error fetching chats:", error);
                setError("Failed to fetch chats");
            }
        };

        fetchChats();
    }, [userId, chatId]);

    if(error) {
        return <div className="text-red-500">Error: {error}</div>
    }

    if(!userId) {
        return null; // or a loading state
    }

    return (
      <div className="flex max-h-screen overflow-hidden">
        {/* Mobile menu button */}
        <Button
          onClick={() => setShowSidebar(!showSidebar)}
          className="fixed top-4 left-4 z-50 md:hidden p-2 bg-gray-900 text-white"
          size="icon"
          variant="ghost"
        >
          <Menu />
        </Button>

        {/* Sidebar */}
        <div
          className={`fixed md:static w-[300px] h-full transition-transform duration-300 ease-in-out transform 
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          bg-white z-40 border-r border-gray-200`}
        >
          <ChatSideBar chats={chatsData} chatId={parseInt(chatId)} onChatSelect={() => setShowSidebar(false)} />
        </div>

        {/* Overlay for mobile */}
        {showSidebar && (
          <div 
            className="fixed inset-0 bg-black/20 z-30 md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Main chat area */}
        <div className="flex-1 h-screen overflow-hidden w-full">
          <ChatComponent chatId={parseInt(chatId)} />
        </div>
      </div>
    )
}

export default ChatPage;