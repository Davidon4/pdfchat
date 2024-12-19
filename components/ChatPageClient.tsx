"use client"

import React, {useState} from "react";
import ChatSideBar from "@/components/ChatSideBar";
import ChatComponent from "@/components/ChatComponent";
import MobileSidebarToggle from "@/components/MobileSidebarToggle";

type Chat = {
    id: number;
    pdfName: string;
    pdfUrl: string;
    createdAt: Date;
    userId: string;
    fileKey: string;
    status: "processing" | "complete" | "failed";
  };
  
  type Props = {
    chats: Chat[]; // Use the updated type for chats
    chatId: number;
  };
export default function ChatPageClient({ chats, chatId }: Props) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

      const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
      }
    return (
      <div className="flex flex-col h-screen md:flex-row">
      <div className="md:hidden p-2">
        <MobileSidebarToggle onClick={toggleSidebar} />
      </div>

        <div
        className={`${
          isSidebarOpen ? 'block' : 'hidden'
        } md:block md:flex-[1] md:max-w-xs h-full overflow-y-auto transition-all duration-300 ease-in-out`}
      >
          <ChatSideBar chats={chats} chatId={chatId} />
        </div>
        {/* chat component */}
        <div className="flex-[3] h-full overflow-y-auto border-l border-l-slate-200">
          <ChatComponent chatId={chatId} />
        </div>
      </div>
    )
}