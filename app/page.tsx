import { Button } from "@/components/ui/button";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {UserButton} from '@clerk/nextjs';
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function Home() {
  const {userId} = await auth();
  let user = null;
  let chat_id: string | number | null = null;

  if (userId) {
    user = await (await clerkClient()).users.getUser(userId as string);
  const existingChat = await db.select().from(chats).where(eq(chats.userId, userId)).limit(1);
  chat_id = existingChat[0]?.id?.toString();
  }
  const isAuth = !!userId;

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-rose-100 to-teal-100">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mr-3 text-5xl font-semibold">Chat with PDFCHAT</h1>
            <UserButton afterSwitchSessionUrl= "/" />
          </div>

          <div className="flex mt-2">
            {isAuth && chat_id && (
              <>
               <Link href={`/`}>
                  <Button>
                    Go to Chat Page <ArrowRight className="ml-2" />
                  </Button>
                  </Link>
              </>
            )}
          </div>

          <p className="max-w-xl mt-1 text-lg text-slate-600">
          With PdfChat, you can join retirees worldwide to gain insights into your U.S. retirement savings.
          </p>

          <div className="w-full mt-4">
            {isAuth ? (
              <FileUpload />
             ) : (
                <Link href="/sign-in">
                <Button>
                  Login to get Started!
                  <LogIn className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
