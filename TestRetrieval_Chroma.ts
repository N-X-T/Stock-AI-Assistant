// import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
// import { TaskType } from "@google/generative-ai";
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
// import fs from 'fs/promises';
// import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
// import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
// import {
//     ChatPromptTemplate,
//     MessagesPlaceholder,
// } from "@langchain/core/prompts";
// import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';

(async function () {
    const embeddings = new OllamaEmbeddings({
        model: "hf.co/doof-ferb/halong-embedding-gguf:latest",
    });
    const vectorStore = new Chroma(embeddings, {
        collectionName: "stocks_news",
        url: "http://14.224.131.219:8505",
        collectionMetadata: {
            "hnsw:space": "cosine",
        },
    });
    const filter = { symbol: "VHM" };

    const similaritySearchResults = await vectorStore.similaritySearch(
        "Tin tức VHM",
        2,
        filter
    );
    console.log(similaritySearchResults);
})();