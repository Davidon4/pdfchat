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
            const response = await axios.get(`/api/chat-status/${chatId}`);
            return response.data.status;
        },
        enabled: !!chatId,
        refetchInterval: (query) => query.state.data === 'processing' ? 1000 : false,
    });
    
    useEffect(() => {
        if (processingStatus === 'complete') {
            router.push(`/chat/${chatId}`);
        } else if (processingStatus === 'failed') {
            toast.error("Failed to process PDF");
        }
    }, [processingStatus, chatId, router]);

    const {mutate} = useMutation({
        mutationFn: async ({file_key, file_name}: {file_key: string, file_name: string}) => {
            const response = await axios.post('/api/create-chat',{file_key, file_name})
            return response.data;
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
                    toast.success("Processing PDF...");
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