"use client";

import React, {useEffect} from 'react';
import { useDropzone } from 'react-dropzone';
import { Inbox, Loader2 } from 'lucide-react';
import { uploadToS3 } from '@/lib/s3';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from "axios";
import { toast } from "react-hot-toast";
import {useRouter} from "next/navigation";

const FileUpload = () => {
    const router = useRouter();
    const [uploading, setUploading] = React.useState(false);
    const [chatId, setChatId] = React.useState<number | null>(null);

    const { data: processingStatus } = useQuery({
        queryKey: ["chat-status", chatId],
        queryFn: async () => {
            if (!chatId) return null;
            console.log("Fetching status for chatId:", chatId);
            const response = await axios.get(`/api/chat-status/${chatId}`);
            console.log("Status response:", response.data);
            return response.data.status;
        },
        enabled: !!chatId,
        refetchInterval: (query) => {
            console.log("Current status:", query.state.data);
            return query.state.data === 'processing' ? 1000 : false;
        },
        initialData: null,
        retry: 3
    });
    
    useEffect(() => {
        if (!processingStatus) return; 
        console.log("Status changed:", processingStatus); 
        if (processingStatus === 'complete') {
            console.log("Redirecting to:", `/chat/${chatId}`);
            router.push(`/chat/${chatId}`);
        } else if (processingStatus === 'failed') {
            toast.error("Failed to process PDF");
        }
    }, [processingStatus, chatId, router]);

    const {mutate} = useMutation({
        mutationFn: async ({file_key, file_name}: {file_key: string, file_name: string}) => {
            console.log("Creating chat with:", {file_key, file_name});
            const response = await axios.post('/api/create-chat', {
                file_key,
                file_name,
                startPage: 0
            });
            console.log("Create chat response:", response.data);
            return response.data;
        },
        onSuccess: (data) => {
            console.log("Chat created successfully:", data);
            toast.success("Processing PDF...");
            setChatId(data.chat_id);
        },
        onError: (err) => {
            console.error("Error creating chat:", err);
            toast.error("Error creating chat");
        }
    });

    const {getRootProps, getInputProps} = useDropzone({
        accept: {"application/pdf": [".pdf"]},
        maxFiles: 1,
        onDrop: async (acceptedFiles) => { 
            const file = acceptedFiles[0]
            if (file.size > 10 * 1024 * 1024) {
                toast.error("File too large");
                return; 
            }

            try {
                setUploading(true);
            const data = await uploadToS3(file);
            if (!data?.file_key || !data.file_name) {
                toast.error("Something went wrong");
                return;
            }
             mutate(data, {
                onSuccess: ({ chat_id }) => {
                    toast.success("Processed PDF...");
                    setChatId(chat_id);
                  },
                onError: (err) => {
                    toast.error("Error creating chat");
                    console.error(err);
                }
             })
            } catch (error) {
                console.log(error)
            } finally {
                setUploading(false);
            }
        }
    });
  return (
    <div className="p-2 bg-white rounded-xl">
        <div {...getRootProps({
                      className:
                      "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col",        
        })}>
            <input {...getInputProps()}/>
            {(uploading || processingStatus === 'processing') ? (
            <>
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin"/>
              <p className="mt-2 text-sm text-slate-400">
              {uploading ? "Uploading PDF..." : "Processing PDF..."}   
            </p>    
            </>
            ) : (
            <>
            <Inbox className="w-10 h-10 text-blue-500"/>
            <p className="mt-2 text-sm text-slate-400">Drop PDF Here</p>
            </>
            )}
        </div>
    </div>
  )
}

export default FileUpload;


// Update your frontend to poll for status:
// const checkStatus = async (chatId: string) => {
//     const response = await axios.get(`/api/chat-status/${chatId}`);
//     return response.data.status;
// };

// // In your upload success handler:
// const { mutate } = useMutation({
//     mutationFn: async () => {
//         const response = await axios.post("/api/process-chat", {
//             file_key: fileKey,
//             chat_id: chatId,
//         });
        
//         // Start polling for status
//         const interval = setInterval(async () => {
//             const status = await checkStatus(chatId);
//             if (status === 'complete' || status === 'failed') {
//                 clearInterval(interval);
//                 if (status === 'complete') {
//                     toast.success("Processing complete!");
//                     router.push(`/chat/${chatId}`);
//                 } else {
//                     toast.error("Processing failed!");
//                 }
//             }
//         }, 5000); // Check every 5 seconds
        
//         return response.data;
//     },
// });