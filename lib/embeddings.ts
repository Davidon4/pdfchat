import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30000,
});

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getEmbeddings(text: string, retries = 3): Promise<number[]> {
  for (let i = 0; i < retries; i++) {
  try {
    const truncatedText = text.slice(0, 8000);
    const cleanText = truncatedText.replace(/\n/g, " ");

    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: cleanText,
    });

    return response.data[0].embedding;
  } catch (error) {
    if (i === retries - 1) throw error;
    console.log(`Embedding attempt ${i + 1} failed, retrying after ${(i + 1) * 1000}ms...`);
    await sleep((i + 1) * 1000); // Exponential backoff
  }
}
throw new Error("Failed to get embeddings after all retries");
}
