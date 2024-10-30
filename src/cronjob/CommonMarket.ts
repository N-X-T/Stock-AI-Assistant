import fetch from "node-fetch";
import fs from 'fs';
import path from 'path';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { getGeminiApiKey } from "../config";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

const saveFile = (content: string, symbol: string, fileName: string) => {
    const filePath = path.resolve(`./data/stock/${symbol}/raw/${fileName}`);

    fs.mkdir(path.dirname(filePath), { recursive: true }, (err) => {
        if (err) {
            console.error('Lỗi khi tạo thư mục:', err);
            return;
        }

        fs.writeFile(filePath, content, (err) => {
            if (err) {
                console.error('Lỗi khi ghi file:', err);
            }
        });
    });
}

const industry_classification = async () => {
    const res = await fetch("https://api-finfo.vndirect.com.vn/v4/industry_classification?q=industryLevel:2");
    const body = await res.json();
    const industry_classification = new Map();
    for (let i in body.data) {
        industry_classification.set(body.data[i].industryCode, body.data[i]);
    }
    return industry_classification;
}

const industry_changne = async () => {
    const industry = await industry_classification();

    const res = await fetch("https://mkw-socket-v2.vndirect.com.vn/mkwsocketv2/industrychange");
    const body = await res.json();
    for (let i in body.data) {
        body.data[i].industryName = industry.get(body.data[i].indexCode).vietnameseName;
        //body.data[i].tickerList = industry.get(body.data[i].indexCode).codeList;
        delete body.data[i].indexCode;
    }
    const bodyText = JSON.stringify(body).replaceAll("indIndex", "industryIndex")
        .replaceAll("indChgCr", "industryChangeCurrent")
        .replaceAll("indChgPctCr", "industryChangePercentCurrent");
    saveFile(bodyText, "common", "CommonMarket.txt");
    return bodyText;
}

const analysis = async () => {
    const rawCommonMarket = await industry_changne();

    const promptVN = `Bạn là một nhà phân tích tài chính dày dạn kinh nghiệm được giao nhiệm vụ tiến hành phân tích toàn diện về thị trường chứng khoán.
Dưới đây là các dữ liệu biến động giá về các ngành trong thị trường:
{raw}

Hôm nay là ${new Date().toISOString()}
`;
    const llm = new ChatGoogleGenerativeAI({
        model: "gemini-1.5-flash",
        apiKey: getGeminiApiKey(),
        temperature: 0
    });

    const prompt = ChatPromptTemplate.fromTemplate(promptVN);

    const chain = RunnableSequence.from([
        prompt,
        llm,
        new StringOutputParser(),
    ]);

    const res = await chain.invoke({
        raw: rawCommonMarket
    });

    saveFile(res, "common", "summary.txt");
}

analysis();