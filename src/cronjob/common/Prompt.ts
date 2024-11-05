import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { getGeminiApiKey } from "../../config";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import fs from 'fs/promises';
import path from 'path';

const listIndustry = [
    {
        "id": 240,
        "name": "Bán lẻ",
        "code": "5300"
    },
    {
        "id": 280,
        "name": "Bảo hiểm",
        "code": "8500"
    },
    {
        "id": 334,
        "name": "Bất động sản",
        "code": "8600"
    },
    {
        "id": 305,
        "name": "Công nghệ Thông tin",
        "code": "9500"
    },
    {
        "id": 142,
        "name": "Dầu khí",
        "code": "0500"
    },
    {
        "id": 281,
        "name": "Dịch vụ tài chính",
        "code": "8700"
    },
    {
        "id": 271,
        "name": "Điện, nước & xăng dầu khí đốt",
        "code": "7500"
    },
    {
        "id": 242,
        "name": "Du lịch và Giải trí",
        "code": "5700"
    },
    {
        "id": 171,
        "name": "Hàng & Dịch vụ Công nghiệp",
        "code": "2700"
    },
    {
        "id": 203,
        "name": "Hàng cá nhân & Gia dụng",
        "code": "3700"
    },
    {
        "id": 147,
        "name": "Hóa chất",
        "code": "1300"
    },
    {
        "id": 279,
        "name": "Ngân hàng",
        "code": "8300"
    },
    {
        "id": 201,
        "name": "Ô tô và phụ tùng",
        "code": "3300"
    },
    {
        "id": 148,
        "name": "Tài nguyên Cơ bản",
        "code": "1700"
    },
    {
        "id": 202,
        "name": "Thực phẩm và đồ uống",
        "code": "3500"
    },
    {
        "id": 241,
        "name": "Truyền thông",
        "code": "5500"
    },
    {
        "id": 264,
        "name": "Viễn thông",
        "code": "6500"
    },
    {
        "id": 170,
        "name": "Xây dựng và Vật liệu",
        "code": "2300"
    },
    {
        "id": 231,
        "name": "Y tế",
        "code": "4500"
    }
];


const promptVN = `Bạn là một nhà phân tích tài chính dày dạn kinh nghiệm được giao nhiệm vụ tiến hành phân tích toàn diện về thị trường chứng khoán.

Dưới đây là các dữ liệu về một ngành trong thị trường:
---
Tên ngành:
{industry_name}
---
Biến động giá
{price}
---
Balance Sheet
{balance_sheet}
---
Income Statement
{income_statement}
---
Cash Flow
{cash_flow}
---
Financial Ratio
{financial_ratio}
---
Hôm nay là ${new Date().toISOString()}
`;

const saveFile = async (content: string, symbol: string, fileName: string) => {
    const filePath = path.resolve(`./data/common/${symbol}/summary/${fileName}`);

    let mkdir = await fs.mkdir(path.dirname(filePath), { recursive: true });
    let mkfile = await fs.writeFile(filePath, content);
}

const loadJson = async (path: string): Promise<string> => {
    let content = await fs.readFile(path, { encoding: "utf-8" });
    return content;
}

const summary = async (industryCode: string, industry_name: string, price) => {
    const pathh = `./data/common/${industryCode}/raw`;

    const balance_sheet = await loadJson(`${pathh}/balancesheet.json`);
    const cash_flow = await loadJson(`${pathh}/cashflow.json`);
    const income_statement = await loadJson(`${pathh}/incomestatement.json`);
    const financial_ratio = await loadJson(`${pathh}/financialratio.json`);

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
        industry_name,
        price: JSON.stringify(price),
        balance_sheet,
        cash_flow,
        income_statement,
        financial_ratio
    });

    saveFile(res, industryCode, "summary.txt");
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const GetAllSummary = async () => {
    const price_all = JSON.parse(await loadJson(`./data/common/raw/DynamicPrice.json`));
    for (let i in listIndustry) {
        console.log(`Analysis ${listIndustry[i].name}...`);
        await summary(listIndustry[i].code, listIndustry[i].name, price_all.data.find(e => e.indexCode == listIndustry[i].code));
        console.log(`Done ${listIndustry[i].name}...`);
        await delay(15000);
    }
}

export default GetAllSummary;

GetAllSummary();
