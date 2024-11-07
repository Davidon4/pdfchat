import {Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {
    Document,
    RecursiveCharacterTextSplitter,
  } from "@pinecone-database/doc-splitter";
import md5 from "md5";
import { getEmbeddings } from "./embeddings";
import { convertToAscii } from "./utils";

const CHUNK_SIZE = 1000;  // Smaller chunks
const CHUNK_OVERLAP = 20;  // Minimal overlap
const BATCH_SIZE = 100;

export const getPineconeClient = async () => {
    return new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!
        }) 
    }

type PDFPage = {
        pageContent: string;
        metadata: {
          loc: { pageNumber: number };
        };
    };

export async function loadS3IntoPinecone(
  fileKey: string,
  startPage: number = 0,
  chunkSize: number = 20
) {
  try{
    //1. obtain the pdf
    console.log("Downloading s3 into file system")

    const file_name = await downloadFromS3(fileKey);
    if (!file_name) {
        throw new Error("Could not download from s3")
    }
    console.log("Loading PDF...");
    const loader = new PDFLoader(file_name)
    const pages = (await loader.load()) as PDFPage[]

        // 2. Process only the specified range of pages
        const endPage = Math.min(startPage + chunkSize, pages.length);
        const currentPages = pages.slice(startPage, endPage);

    //3. split and segment the pdf 
    console.log(`Preparing documents for pages ${startPage} to ${endPage}...`);
    const documents = await prepareDocuments(currentPages);

    // 3. vectorise and embed individual documents
    console.log("Processing embeddings in batches...");
    const vectors: PineconeRecord[] = [];
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      const batchVectors = await Promise.all(batch.map(embedDocument));
      vectors.push(...batchVectors.filter(v => v !== null));
      console.log(`Processed batch ${i / BATCH_SIZE + 1} of ${Math.ceil(documents.length / BATCH_SIZE)}`);
    }

    // 4. upload to pinecone
    console.log("Uploading to Pinecone...");
    const client = await getPineconeClient();
    const pineconeIndex = await client.index("pdfchat");
    const namespace = pineconeIndex.namespace(convertToAscii(fileKey));
  
        // Upload vectors in smaller batches to Pinecone
        for (let i = 0; i < vectors.length; i += 100) {
          const batch = vectors.slice(i, i + 100);
          await namespace.upsert(batch);
          console.log(`Uploaded vectors batch ${i / 100 + 1} of ${Math.ceil(vectors.length / 100)}`);
        }
  
        return {
          hasMore: endPage < pages.length,
          nextPage: endPage,
          totalPages: pages.length
        };
  } catch (error) {
    console.error("Error in loadS3IntoPinecone:", error);
    throw error;
  }
}



export const truncateStringByBytes = (str: string, bytes: number) => {
    const enc = new TextEncoder();
    return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
  };

async function prepareDocuments(pages: PDFPage[]) {
  const documents: Document[] = [];

    for (const page of pages) {
    let { pageContent } = page;
    const {metadata} = page;
    const text = pageContent = pageContent.replace(/\n/g, "").trim();
    // split the docs
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE, 
      chunkOverlap: CHUNK_OVERLAP,
      separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""],
    });

    const docs = await splitter.splitDocuments([
      new Document({
        pageContent: text,
        metadata: {
          pageNumber: metadata.loc.pageNumber,
          text: truncateStringByBytes(text, 1000),
        },
      }),
    ]);
    documents.push(...docs);
  }
    return documents;
  }

  async function embedDocument(doc: Document): Promise<PineconeRecord | null> {
    try {
      const truncatedContent = truncateStringByBytes(doc.pageContent, 2000);
      const embeddings = await getEmbeddings(truncatedContent);
      const hash = md5(truncatedContent);
  
      return {
        id: hash,
        values: embeddings,
        metadata: {
          text: truncateStringByBytes(doc.metadata.text as string, 1000) as string,
          pageNumber: doc.metadata.pageNumber as number,
        },
      };
    } catch (error) {
      console.log("error embedding document", error);
      throw error;
    }
  }