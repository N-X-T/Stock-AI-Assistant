import { config } from 'dotenv'
config();

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import fs from 'fs/promises';
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import {
    ChatPromptTemplate,
    MessagesPlaceholder,
} from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

(async function () {
    const llm = new ChatGoogleGenerativeAI(
        {
            model: 'gemini-1.5-flash',
            apiKey: "AIzaSyCwvp-B6afeHAozxV6Ctrrjv_UNWoUIfqg"
        });
    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-multilingual-embedding-002",
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        apiKey: "AIzaSyCwvp-B6afeHAozxV6Ctrrjv_UNWoUIfqg"
    });
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 800,
        chunkOverlap: 0,
    });
    const summary = await fs.readFile("./data/stock/VIC/summary/summary.txt", "utf-8");
    const allSplits = await textSplitter.createDocuments([summary]);

    const vectorStore = await HNSWLib.fromDocuments(allSplits, embeddings);

    await vectorStore.save("./embedding")

    const retriever = vectorStore.asRetriever(2);

    const docs = await retriever.invoke("Tăng trưởng doanh thu của Vingroup");

    console.log(docs);

    const SYSTEM_TEMPLATE = `Trả lời câu hỏi của người dùng dựa trên ngữ cảnh bên dưới.
Nếu ngữ cảnh không chứa bất kỳ thông tin liên quan nào đến câu hỏi, đừng bịa ra điều gì đó và chỉ nói "Tôi không biết":

<context>
{context}
</context>
`;

    const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
        ["system", SYSTEM_TEMPLATE],
        new MessagesPlaceholder("messages"),
    ]);

    const documentChain = await createStuffDocumentsChain({
        llm,
        prompt: questionAnsweringPrompt,
    });
    const res = await documentChain.invoke({
        messages: [new HumanMessage("Tăng trưởng doanh thu của Vingroup")],
        context: docs,
    });

    console.log(res);

})();