import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { getGeminiApiKey } from "../../config";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import fs from 'fs/promises';
import path from 'path';

// const listIndustry = [
//     {
//         "id": 240,
//         "name": "Bán lẻ",
//         "code": "5300"
//     },
//     {
//         "id": 280,
//         "name": "Bảo hiểm",
//         "code": "8500"
//     },
//     {
//         "id": 334,
//         "name": "Bất động sản",
//         "code": "8600"
//     },
//     {
//         "id": 305,
//         "name": "Công nghệ Thông tin",
//         "code": "9500"
//     },
//     {
//         "id": 142,
//         "name": "Dầu khí",
//         "code": "0500"
//     },
//     {
//         "id": 281,
//         "name": "Dịch vụ tài chính",
//         "code": "8700"
//     },
//     {
//         "id": 271,
//         "name": "Điện, nước & xăng dầu khí đốt",
//         "code": "7500"
//     },
//     {
//         "id": 242,
//         "name": "Du lịch và Giải trí",
//         "code": "5700"
//     },
//     {
//         "id": 171,
//         "name": "Hàng & Dịch vụ Công nghiệp",
//         "code": "2700"
//     },
//     {
//         "id": 203,
//         "name": "Hàng cá nhân & Gia dụng",
//         "code": "3700"
//     },
//     {
//         "id": 147,
//         "name": "Hóa chất",
//         "code": "1300"
//     },
//     {
//         "id": 279,
//         "name": "Ngân hàng",
//         "code": "8300"
//     },
//     {
//         "id": 201,
//         "name": "Ô tô và phụ tùng",
//         "code": "3300"
//     },
//     {
//         "id": 148,
//         "name": "Tài nguyên Cơ bản",
//         "code": "1700"
//     },
//     {
//         "id": 202,
//         "name": "Thực phẩm và đồ uống",
//         "code": "3500"
//     },
//     {
//         "id": 241,
//         "name": "Truyền thông",
//         "code": "5500"
//     },
//     {
//         "id": 264,
//         "name": "Viễn thông",
//         "code": "6500"
//     },
//     {
//         "id": 170,
//         "name": "Xây dựng và Vật liệu",
//         "code": "2300"
//     },
//     {
//         "id": 231,
//         "name": "Y tế",
//         "code": "4500"
//     }
// ];


const promptVN = `Bạn là một nhà phân tích tài chính dày dạn kinh nghiệm được giao nhiệm vụ tiến hành phân tích toàn diện về thị trường chứng khoán Việt Nam.

Hãy tóm tắt về tình hình thị trường chứng khoán Việt Nam dựa trên dữ liệu của các ngành sau đây:
---
{industry}
---
Hôm nay là ${new Date().toISOString()}
`;

const saveFile = async (content: string) => {
    const filePath = path.resolve(`./data/common/all/summary.txt`);

    let mkdir = await fs.mkdir(path.dirname(filePath), { recursive: true });
    let mkfile = await fs.writeFile(filePath, content);
}

const loadAllJson = async (): Promise<string> => {
    let result = "";

    const baseDir = path.resolve('./data/common');

    try {
        const directories = await fs.readdir(baseDir, { withFileTypes: true });

        for (const dir of directories) {
            if (dir.isDirectory()) {
                const summaryFilePath = path.join(baseDir, dir.name, 'summary', 'summary.txt');

                try {
                    result += await fs.readFile(summaryFilePath, 'utf8') + "\n";
                } catch (err) {
                    console.error(`Could not read file for ID ${dir.name}:`, err.message);
                }
            }
        }
    } catch (err) {
        console.error('Error reading base directory:', err.message);
    }
    return result;
}

const summary = async () => {
    const industry = await loadAllJson();

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
        industry
    });

    saveFile(res);
}

summary();
