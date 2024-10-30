import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import fs from 'fs/promises';
import path from 'path';
import { getGeminiApiKey } from '../config';

const loadJson = async (path: string): Promise<string> => {
    let content = await fs.readFile(path, { encoding: "utf-8" });
    return content;
}

const VN100List = ["AAA", "ACB", "ANV", "ASM", "BCG", "BCM", "BID", "BMP", "BSI", "BVH", "BWE", "CII", "CMG", "CRE", "CTD", "CTG", "CTR", "DBC", "DCM", "DGC", "DGW", "DIG", "DPM", "DXG", "DXS", "EIB", "EVF", "FPT", "FRT", "FTS", "GAS", "GEX", "GMD", "GVR", "HAG", "HCM", "HDB", "HDC", "HDG", "HHV", "HPG", "HSG", "HT1", "IMP", "KBC", "KDC", "KDH", "KOS", "LPB", "MBB", "MSB", "MSN", "MWG", "NKG", "NLG", "NT2", "NVL", "OCB", "PAN", "PC1", "PDR", "PHR", "PLX", "PNJ", "POW", "PPC", "PTB", "PVD", "PVT", "REE", "SAB", "SBT", "SCS", "SHB", "SIP", "SJS", "SSB", "SSI", "STB", "SZC", "TCB", "TCH", "TLG", "TPB", "VCB", "VCG", "VCI", "VGC", "VHC", "VHM", "VIB", "VIC", "VIX", "VJC", "VND", "VNM", "VPB", "VPI", "VRE", "VSH"];

const promptEN = `You are a seasoned financial analyst tasked with evaluating the financial health of a company's stock by analyzing its latest quarterly results. Your goal is to provide a comprehensive assessment of the company's performance, highlighting recent trends and developments in key areas such as profitability, revenue growth, debt levels, and cash flow generation.

Please structure your response using the following format:

## Company Overview
[Provide a brief overview of the company, its business, and the industry it operates in.]

## Financial Analysis

### Profitability
[Analyze the company's profitability, including trends in gross margins, operating margins, and net income.]

### Revenue Growth
[Assess the company's revenue growth, including any changes in the revenue mix or product/service offerings.]

### Debt and Capital Structure
[Evaluate the company's debt levels and capital structure, including debt-to-equity ratios, interest coverage, and the overall debt burden.]

### Cash Flow Generation
[Examine the company's cash flow generation, focusing on operating cash flow, free cash flow, and any changes in working capital.]

## Conclusion
[Provide a well-reasoned conclusion on the overall financial health of the company and its stock, highlighting the key strengths and weaknesses you have observed.]

---
Here are the company's financial data:
---
Overview
{overview}
---
Stock ratio
{stock_ratio}
---
Industry Average
{industryAvg}
---
History Price
{price_volatility}
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
`;

const promptVN = `Bạn là một nhà phân tích tài chính dày dạn kinh nghiệm được giao nhiệm vụ đánh giá sức khỏe tài chính của cổ phiếu công ty bằng cách phân tích kết quả quý gần đây nhất của công ty. Mục tiêu của bạn là cung cấp đánh giá toàn diện về hiệu suất của công ty, nêu bật các xu hướng và diễn biến gần đây trong các lĩnh vực chính như lợi nhuận, tăng trưởng doanh thu, mức nợ và tạo ra dòng tiền.

Vui lòng cấu trúc phản hồi của bạn theo định dạng sau:

## Tổng quan về công ty
[Cung cấp tổng quan ngắn gọn về công ty, hoạt động kinh doanh và ngành mà công ty đang hoạt động.]

## Phân tích tài chính

### Khả năng sinh lời
[Phân tích khả năng sinh lời của công ty, bao gồm xu hướng về biên lợi nhuận gộp, biên lợi nhuận hoạt động và thu nhập ròng.]

### Tăng trưởng doanh thu
[Đánh giá mức tăng trưởng doanh thu của công ty, bao gồm mọi thay đổi trong cơ cấu doanh thu hoặc sản phẩm/dịch vụ cung cấp.]

### Nợ và cấu trúc vốn
[Đánh giá mức nợ và cấu trúc vốn của công ty, bao gồm tỷ lệ nợ trên vốn chủ sở hữu, khả năng chi trả lãi vay và gánh nặng nợ chung.]

### Tạo dòng tiền
[Xem xét khả năng tạo dòng tiền của công ty, tập trung vào dòng tiền hoạt động, dòng tiền tự do và mọi thay đổi trong vốn lưu động.]

## Kết luận
[Cung cấp kết luận hợp lý về tình hình tài chính chung của công ty và cổ phiếu của công ty, nêu bật những điểm mạnh và điểm yếu chính mà bạn đã quan sát được.]

---
Dưới đây là dữ liệu tài chính của công ty, đơn vị tiền tệ là tỷ Việt Nam Đồng:
---
Overview
{overview}
---
Stock ratio
{stock_ratio}
---
Industry Average
{industryAvg}
---
History Price
{price_volatility}
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
`;

const summary = async (symbol: string) => {
    const pathh = `./data/stock/${symbol}/raw`;

    const overview = await loadJson(`${pathh}/overview.json`);
    const stock_ratio = await loadJson(`${pathh}/stockratio.json`);
    const industryAvg = await loadJson(`${pathh}/industryAvg.json`);
    const price_volatility = await loadJson(`${pathh}/price_volatility.json`);
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
        overview,
        stock_ratio,
        industryAvg,
        price_volatility,
        balance_sheet,
        income_statement,
        cash_flow,
        financial_ratio
    });

    //console.log(res);
    await saveFile(res, symbol, "summary.txt")
}

const saveFile = async (content: string, symbol: string, fileName: string) => {
    const filePath = path.resolve(`./data/stock/${symbol}/summary/${fileName}`);

    let mkdir = await fs.mkdir(path.dirname(filePath), { recursive: true });
    let mkfile = await fs.writeFile(filePath, content);
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const GetAllSummary = async () => {
    for (let i in VN100List) {
        console.log(`Analysis ${VN100List[i]}...`);
        await summary(VN100List[i]);
        console.log(`Done ${VN100List[i]}...`);
        await delay(15000);
    }
}

export default GetAllSummary;