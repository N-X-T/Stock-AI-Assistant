import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import fs from 'fs/promises';
import path from 'path';
import { getGeminiApiKey } from '../config';

const VN100List = ["AAA", "ACB", "ANV", "ASM", "BCG", "BCM", "BID", "BMP", "BSI", "BVH", "BWE", "CII", "CMG", "CRE", "CTD", "CTG", "CTR", "DBC", "DCM", "DGC", "DGW", "DIG", "DPM", "DXG", "DXS", "EIB", "EVF", "FPT", "FRT", "FTS", "GAS", "GEX", "GMD", "GVR", "HAG", "HCM", "HDB", "HDC", "HDG", "HHV", "HPG", "HSG", "HT1", "IMP", "KBC", "KDC", "KDH", "KOS", "LPB", "MBB", "MSB", "MSN", "MWG", "NKG", "NLG", "NT2", "NVL", "OCB", "PAN", "PC1", "PDR", "PHR", "PLX", "PNJ", "POW", "PPC", "PTB", "PVD", "PVT", "REE", "SAB", "SBT", "SCS", "SHB", "SIP", "SJS", "SSB", "SSI", "STB", "SZC", "TCB", "TCH", "TLG", "TPB", "VCB", "VCG", "VCI", "VGC", "VHC", "VHM", "VIB", "VIC", "VIX", "VJC", "VND", "VNM", "VPB", "VPI", "VRE", "VSH"];


const promptVN = `Bạn là một nhà phân tích tài chính dày dạn kinh nghiệm được giao nhiệm vụ tiến hành phân tích toàn diện về hiệu suất của một cổ phiếu. Mục tiêu của bạn là đánh giá hiệu suất của cổ phiếu bằng các số liệu chính như Lợi nhuận tích lũy, Biến động, Tỷ lệ Sharpe, Mức giảm tối đa và Ma trận tương quan. Ngoài ra, bạn sẽ thực hiện phân tích so sánh bằng cách so sánh hiệu suất của cổ phiếu với các cổ phiếu liên quan và chỉ số VN100.

Vui lòng phân tích và đưa ra nhận xét súc tích và có thực tế, chỉ trích dẫn số liệu cần thiết, không trích dẫn tất cả(ví dụ: không trích dẫn bảng số liệu vào câu trả lời). Báo cáo của bạn phải bao gồm các phần sau:

---

## Chỉ số hiệu suất cổ phiếu

### Lợi nhuận tích lũy


### Biến động


### Tỷ lệ Sharpe


### Mức giảm tối đa


### Tương quan


## Phân tích so sánh

### So sánh với các cổ phiếu liên quan


### So sánh với chỉ số VN100


## Kết luận và khuyến nghị


---
Dưới đây là các dữ liệu cần thiết cho việc tính toán của bạn:
---
Overview
{overview}
---
Dữ liệu chỉ số VN100:
{VN100}
---
Chỉ số lợi nhuận tích luỹ, tỉ số sharpe, mức giảm tối đa của cổ phiếu và các cổ phiếu cùng ngành:
{dynamic_price}
---
`;

const saveFile = async (content: string, symbol: string, fileName: string) => {
    const filePath = path.resolve(`./data/stock/${symbol}/summaryDynamicPrice/${fileName}`);

    let mkdir = await fs.mkdir(path.dirname(filePath), { recursive: true });
    let mkfile = await fs.writeFile(filePath, content);
}

const loadJson = async (path: string): Promise<string> => {
    let content = await fs.readFile(path, { encoding: "utf-8" });
    return content;
}

const summary = async (symbol: string) => {
    const pathh = `./data/stock/${symbol}/raw`;

    const overview = await loadJson(`${pathh}/overview.json`);
    const VN100 = await loadJson(`./data/stock/VN100/raw/DynamicPrice.json`);
    const dynamic_price = await loadJson(`${pathh}/DynamicPrice.json`);

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
        dynamic_price,
        VN100
    });

    //console.log(res);
    await saveFile(res, symbol, "summary.txt")
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