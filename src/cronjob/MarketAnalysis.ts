// import { config } from 'dotenv'
// config();

import { getNewsEndpoint, getMistralApiKey } from '../config'
import { ChatMistralAI } from "@langchain/mistralai";
import db from '../db';
import { marketInfo } from '../db/schema';

const post = async (url: string, data: string) => {
    try {
        let res = await fetch(url, { method: "POST", headers: { "accept-language": "vi", 'Content-Type': 'application/json' }, body: data });
        let body = await res.json();
        return body;
    } catch {
        return {};
    }
}

const MarketAnalysis = async () => {
    try {
        const llm = new ChatMistralAI(
            {
                model: 'mistral-large-latest',
                apiKey: getMistralApiKey(),
                temperature: 0,
                topP: 1
            }
        );

        const data = {
            "query": "tình hình thị trường",
            "top_k": 15,
            "filter": {
                "date": new Date().toISOString().substring(0, 10)
            }
        };
        const news = await post(getNewsEndpoint()!, JSON.stringify(data));
        const newsContext = news.map(doc => `Nguồn ${doc.metadata.source}: ${doc.page_content}`).join("\n\n");

        const prompt = `Bạn đóng vai là một nhà phân tích tài chính giàu kinh nghiệm. Hãy đưa ra tóm tắt tình hình thị trường chứng khoán Việt Nam và đưa ra lời khuyên/nhận xét. Dưới đây là tin tức về thị trường chứng khoán Việt Nam ngày ${new Date().toISOString().substring(0, 10)}:\n\n${newsContext}`

        const result = await llm.invoke(prompt);

        await db
            .insert(marketInfo)
            .values({
                content: result.content.toString(),
                creatAt: new Date().toISOString()
            });

    } catch (err) {
        console.error(err);
    }
};

export default MarketAnalysis;

// MarketAnalysis();