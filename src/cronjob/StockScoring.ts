// import { config } from 'dotenv'
// config();

import { HumanMessage } from '@langchain/core/messages';
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import moment from 'moment';
import { getNewsEndpoint, getMistralApiKey } from '../config'
import { ChatMistralAI } from "@langchain/mistralai";
import db from '../db';
import { scoring } from '../db/schema';

const ticker_info = [{ "symbol": "AAA" }, { "symbol": "ACB" }, { "symbol": "ANV" }, { "symbol": "ASM" }, { "symbol": "BCG" }, { "symbol": "BCM" }, { "symbol": "BID" }, { "symbol": "BMP" }, { "symbol": "BSI" }, { "symbol": "BVH" }, { "symbol": "BWE" }, { "symbol": "CII" }, { "symbol": "CMG" }, { "symbol": "CRE" }, { "symbol": "CTD" }, { "symbol": "CTG" }, { "symbol": "CTR" }, { "symbol": "DBC" }, { "symbol": "DCM" }, { "symbol": "DGC" }, { "symbol": "DGW" }, { "symbol": "DIG" }, { "symbol": "DPM" }, { "symbol": "DXG" }, { "symbol": "DXS" }, { "symbol": "EIB" }, { "symbol": "EVF" }, { "symbol": "FPT" }, { "symbol": "FRT" }, { "symbol": "FTS" }, { "symbol": "GAS" }, { "symbol": "GEX" }, { "symbol": "GMD" }, { "symbol": "GVR" }, { "symbol": "HAG" }, { "symbol": "HCM" }, { "symbol": "HDB" }, { "symbol": "HDC" }, { "symbol": "HDG" }, { "symbol": "HHV" }, { "symbol": "HPG" }, { "symbol": "HSG" }, { "symbol": "HT1" }, { "symbol": "IMP" }, { "symbol": "KBC" }, { "symbol": "KDC" }, { "symbol": "KDH" }, { "symbol": "KOS" }, { "symbol": "LPB" }, { "symbol": "MBB" }, { "symbol": "MSB" }, { "symbol": "MSN" }, { "symbol": "MWG" }, { "symbol": "NKG" }, { "symbol": "NLG" }, { "symbol": "NT2" }, { "symbol": "NVL" }, { "symbol": "OCB" }, { "symbol": "PAN" }, { "symbol": "PC1" }, { "symbol": "PDR" }, { "symbol": "PHR" }, { "symbol": "PLX" }, { "symbol": "PNJ" }, { "symbol": "POW" }, { "symbol": "PPC" }, { "symbol": "PTB" }, { "symbol": "PVD" }, { "symbol": "PVT" }, { "symbol": "REE" }, { "symbol": "SAB" }, { "symbol": "SBT" }, { "symbol": "SCS" }, { "symbol": "SHB" }, { "symbol": "SIP" }, { "symbol": "SJS" }, { "symbol": "SSB" }, { "symbol": "SSI" }, { "symbol": "STB" }, { "symbol": "SZC" }, { "symbol": "TCB" }, { "symbol": "TCH" }, { "symbol": "TLG" }, { "symbol": "TPB" }, { "symbol": "VCB" }, { "symbol": "VCG" }, { "symbol": "VCI" }, { "symbol": "VGC" }, { "symbol": "VHC" }, { "symbol": "VHM" }, { "symbol": "VIB" }, { "symbol": "VIC" }, { "symbol": "VIX" }, { "symbol": "VJC" }, { "symbol": "VND" }, { "symbol": "VNM" }, { "symbol": "VPB" }, { "symbol": "VPI" }, { "symbol": "VRE" }, { "symbol": "VSH" }];
//const ticker_info = [{ "symbol": "AAA" }];

const LongTermInstruction = `## Hệ thống Đánh Giá Điểm Chi Tiết cho Cổ Phiếu Đầu Tư Dài Hạn

Sử dụng thông tin truy xuất từ các tool được cung cấp, thực hiện đánh giá một cổ phiếu và trả về kết quả theo mẫu sau:

---

**I. Báo Cáo Tài Chính**

* **Doanh thu:**
[Đánh giá tăng trưởng doanh thu: 0-10 điểm]
* **Chi phí:**
[Đánh giá quản lý chi phí: 0-10 điểm]
* **Lợi nhuận:**
[Đánh giá lợi nhuận, ROE, ROA, ROI: 0-10 điểm]
* **Nợ:**
[Đánh giá tỉ lệ nợ(Nợ cao: 0 điểm, Không nợ: 10 điểm): 0-10 điểm]

**II. Kế Hoạch Kinh Doanh/Doanh Thu/Lợi Nhuận Dự Kiến**

* **Khả thi của kế hoạch:**
[Đánh giá kế hoạch dinh khoanh: 0-15 điểm]
* **Triển vọng tăng trưởng:**
[Đánh giá triển vọng tăng trưởng: 0-10 điểm]

**III. Thông Tin Ngành Nghề**

* **Triển vọng ngành:**
[Đánh giá tiềm năng ngành nghề: 0-10 điểm]
* **Vị thế cạnh tranh của doanh nghiệp:**
[Đánh giá lợi thế cạnh tranh: 0-5 điểm]

**IV. Thông Tin Cổ Đông Lớn/Ban Điều Hành**

* **Uy tín và năng lực của ban điều hành:**
[Đánh giá uy tín, năng lực ban điều hành: 0-5 điểm]
* **Cổ đông lớn:**
[Đánh giá cổ đông ổn định/thường xuyên thay đổi/không rõ ràng: 0-5 điểm]

**V. Rủi Ro Chính Trị**

* **Ảnh hưởng của chính sách:**
[Đánh giá ảnh hưởng các chính sách: 0-10 điểm]

**Tổng cộng điểm:**  Tổng điểm của các tiêu chí trên.

**Kết luận:**

* **80-100 điểm:** Cổ phiếu xuất sắc, tiềm năng đầu tư dài hạn rất tốt.
* **60-79 điểm:** Cổ phiếu tốt, có thể xem xét đầu tư.
* **40-59 điểm:** Cổ phiếu trung bình, cần cân nhắc kỹ trước khi đầu tư.
* **Dưới 40 điểm:** Cổ phiếu kém, không nên đầu tư.
---

- Hãy sử dụng các tool được cung cấp để lấy thông tin. Dưới đây là mô tả của các tool:
news_function: "Truy xuất thông tin về các bài báo/tin tức liên quan tới cổ phiếu hoặc thị trường chứng khoán"
stock_ratio_function: "Truy xuất chỉ số cổ phiếu của một mã cổ phiếu cụ thể"
stock_same_industry_function: "Truy xuất thông tin một vài cổ phiếu nổi bật cùng ngành với một mã cổ phiếu cụ thể"
list_technical_indicator_function: "Truy xuất chỉ số kỹ thuật trong một tháng gần đây của một mã cổ phiếu cụ thể: sma5, sma20, macd, macdema, macdhist, ..."
fundamental_technical_analysis_function: "Truy xuất phân tích cơ bản và phân tích kỹ thuật của một mã cổ phiếu cụ thể trong quý gần nhất"
dividend_function: "Truy xuất lịch sử trả cổ tức của một mã cổ phiếu cụ thể"
income_statement_function: "Truy xuất kết quả kinh doanh/báo cáo thu nhập theo quý của một mã cổ phiếu cụ thể"
balance_sheet_function: "Truy xuất kết quả bảng cân đối kế toán theo quý của một mã cổ phiếu cụ thể"
cashflow_function: "Truy xuất lưu chuyển tiền tệ/dòng tiền theo quý của một mã cổ phiếu cụ thể"
financial_ratio_function: "Truy xuất chỉ số tài chính theo quý của một mã cổ phiếu cụ thể"
StockPriceFetcher: "Truy xuất thông tin giá hiện tại và lịch sử của một cổ phiếu"

Hôm nay là ${new Date().toISOString().substring(0, 10)}`;

const ShortTermInstruction = `## Hệ thống Đánh Giá Điểm Cổ Phiếu Cho Đầu Tư Ngắn Hạn

Sử dụng thông tin truy xuất từ các tool được cung cấp, thực hiện đánh giá một cổ phiếu và trả về kết quả theo mẫu sau:

---
**1. Vào Trend Tăng:**

* **Xu hướng đường MA:**
[Đánh giá chỉ số MA20, MA50, MA100: 0-20 điểm]
* **Các mô hình giá tăng:**
[Đánh giá mô hình giá(mô hình giá tăng, tín hiệu phá vỡ kháng cự, không rõ ràng): 0-10 điểm]

**2. Giao Dịch Tăng Đột Biến:**

* **Khối lượng giao dịch:**
[Đánh giá khối lượng giao dịch: 0-15 điểm]
* **Biến động giá:**
[Đánh giá biến động giá: 0-15 điểm]

**3. Thông Tin Tích Cực:**

* **Tin tức tác động mạnh
[Đánh giá tín hiệu tin tức/báo cáo: 0-25 điểm]

**4. Lịch Sử Giá Tăng Đột Biến:**
[Đánh giá lịch sử giá tăng đột biến: 0-15]


**Tổng cộng điểm:**  Tổng điểm của các tiêu chí trên.

**Kết luận:**

* **80-100 điểm:** Cổ phiếu xuất sắc, tiềm năng đầu tư ngắn hạn rất tốt.
* **60-79 điểm:** Cổ phiếu tốt, có thể xem xét đầu tư.
* **40-59 điểm:** Cổ phiếu trung bình, cần cân nhắc kỹ trước khi đầu tư.
* **Dưới 40 điểm:** Cổ phiếu kém, không nên đầu tư.
---

- Hãy sử dụng các tool được cung cấp để lấy thông tin. Dưới đây là mô tả của các tool:
news_function: "Truy xuất thông tin về các bài báo/tin tức liên quan tới cổ phiếu hoặc thị trường chứng khoán"
stock_ratio_function: "Truy xuất chỉ số cổ phiếu của một mã cổ phiếu cụ thể"
stock_same_industry_function: "Truy xuất thông tin một vài cổ phiếu nổi bật cùng ngành với một mã cổ phiếu cụ thể"
list_technical_indicator_function: "Truy xuất chỉ số kỹ thuật trong một tháng gần đây của một mã cổ phiếu cụ thể: sma5, sma20, macd, macdema, macdhist, ..."
fundamental_technical_analysis_function: "Truy xuất phân tích cơ bản và phân tích kỹ thuật của một mã cổ phiếu cụ thể trong quý gần nhất"
dividend_function: "Truy xuất lịch sử trả cổ tức của một mã cổ phiếu cụ thể"
income_statement_function: "Truy xuất kết quả kinh doanh/báo cáo thu nhập theo quý của một mã cổ phiếu cụ thể"
balance_sheet_function: "Truy xuất kết quả bảng cân đối kế toán theo quý của một mã cổ phiếu cụ thể"
cashflow_function: "Truy xuất lưu chuyển tiền tệ/dòng tiền theo quý của một mã cổ phiếu cụ thể"
financial_ratio_function: "Truy xuất chỉ số tài chính theo quý của một mã cổ phiếu cụ thể"
StockPriceFetcher: "Truy xuất thông tin giá hiện tại và lịch sử của một cổ phiếu"

Hôm nay là ${new Date().toISOString().substring(0, 10)}`;

const NewsTool = tool(
    async ({ query, ticker, date }: { query: string, ticker?: string, date?: string }) => {
        const data = {
            "query": query,
            "top_k": 5,
            "filter": {
                "symbol": ticker == "" || ticker == void 0 ? void 0 : ticker
            }
        };
        const news = await post(getNewsEndpoint()!, JSON.stringify(data));
        return news.map(doc => doc.page_content).join("\n\n");
    },
    {
        name: "news_function",
        description: "Truy xuất thông tin về các bài báo/tin tức liên quan tới cổ phiếu hoặc thị trường chứng khoán",
        schema: z.object({
            query: z.string().describe("Câu truy vấn tin tức"),
            ticker: z.string().optional().describe("Mã cổ phiếu của công ty cần lấy thông tin tin tức"),
            //date: z.string().optional().describe("Ngày của tin tức định dạng YYYY-MM-DD")
        })
    }
);

const overview = tool(
    async ({ ticker }: { ticker: string }) => {
        const overview = await get(`https://apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/${ticker}/overview`);
        return overview;
    },
    {
        name: "overview_function",
        description: "Truy xuất thông tin cơ bản về công ty của một cổ phiếu cụ thể: tên công ty, ngành, ...",
        schema: z.object({
            ticker: z.string().describe("Mã cổ phiếu")
        })
    }
);

const stockratio = tool(
    async ({ ticker }: { ticker: string }) => {
        const overview = await get(`https://apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/${ticker}/stockratio`);
        return overview;
    },
    {
        name: "stock_ratio_function",
        description: "Truy xuất chỉ số cổ phiếu của một mã cổ phiếu cụ thể",
        schema: z.object({
            ticker: z.string().describe("Mã cổ phiếu")
        })
    }
);

const stock_same_industry = tool(
    async ({ ticker }: { ticker: string }) => {
        const stock_same_ind = await get(`https://apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/${ticker}/stock-same-ind`);
        return stock_same_ind;
    },
    {
        name: "stock_same_industry_function",
        description: "Truy xuất thông tin một vài cổ phiếu nổi bật cùng ngành với một mã cổ phiếu cụ thể",
        schema: z.object({
            ticker: z.string().describe("Mã cổ phiếu")
        })
    }
);

const listTechnicalIndicator = tool(
    async ({ ticker }: { ticker: string }) => {
        const res = await get(`https://apipubaws.tcbs.com.vn/tcanalysis/v1/data-charts/indicator?ticker=${ticker}`);
        return res;
    },
    {
        name: "list_technical_indicator_function",
        description: "Truy xuất chỉ số kỹ thuật trong một tháng gần đây của một mã cổ phiếu cụ thể: sma5, sma20, macd, macdema, macdhist, ...",
        schema: z.object({
            ticker: z.string().describe("Mã cổ phiếu")
        })
    }
);

const Fundamental_Technical_Analysis = tool(
    async ({ ticker }: { ticker: string }) => {
        const res = await get(`https://apipubaws.tcbs.com.vn/tcbs-hfc-data/v1/ani/fundamental-analysis?ticker=${ticker}`);
        return res;
    },
    {
        name: "fundamental_technical_analysis_function",
        description: "Truy xuất phân tích cơ bản và phân tích kỹ thuật của một mã cổ phiếu cụ thể trong quý gần nhất",
        schema: z.object({
            ticker: z.string().describe("Mã cổ phiếu")
        })
    }
);

const dividend = tool(
    async ({ ticker }: { ticker: string }) => {
        const res = await get(`https://apipubaws.tcbs.com.vn/tcanalysis/v1/company/${ticker}/dividend-payment-histories?page=0&size=500`);
        return res;
    },
    {
        name: "dividend_function",
        description: "Truy xuất lịch sử trả cổ tức của một mã cổ phiếu cụ thể",
        schema: z.object({
            ticker: z.string().describe("Mã cổ phiếu")
        })
    }
);

const incomestatement = tool(
    async ({ ticker }: { ticker: string }) => {
        const res = await get(`https://apipubaws.tcbs.com.vn/tcanalysis/v1/finance/${ticker}/incomestatement?yearly=0&isAll=false`);
        return res;
    },
    {
        name: "income_statement_function",
        description: "Truy xuất kết quả kinh doanh/báo cáo thu nhập theo quý của một mã cổ phiếu cụ thể",
        schema: z.object({
            ticker: z.string().describe("Mã cổ phiếu")
        })
    }
);

const balancesheet = tool(
    async ({ ticker }: { ticker: string }) => {
        const res = await get(`https://apipubaws.tcbs.com.vn/tcanalysis/v1/finance/${ticker}/balancesheet?yearly=0&isAll=false`);
        return res;
    },
    {
        name: "balance_sheet_function",
        description: "Truy xuất kết quả bảng cân đối kế toán theo quý của một mã cổ phiếu cụ thể",
        schema: z.object({
            ticker: z.string().describe("Mã cổ phiếu")
        })
    }
);

const cashflow = tool(
    async ({ ticker }: { ticker: string }) => {
        const res = await get(`https://apipubaws.tcbs.com.vn/tcanalysis/v1/finance/${ticker}/cashflow?yearly=0&isAll=false`);
        return res;
    },
    {
        name: "cashflow_function",
        description: "Truy xuất lưu chuyển tiền tệ/dòng tiền theo quý của một mã cổ phiếu cụ thể",
        schema: z.object({
            ticker: z.string().describe("Mã cổ phiếu")
        })
    }
);

const financialratio = tool(
    async ({ ticker }: { ticker: string }) => {
        const res = await get(`https://apipubaws.tcbs.com.vn/tcanalysis/v1/finance/${ticker}/financialratio?yearly=0&isAll=false`);
        return res;
    },
    {
        name: "financial_ratio_function",
        description: "Truy xuất chỉ số tài chính theo quý của một mã cổ phiếu cụ thể",
        schema: z.object({
            ticker: z.string().describe("Mã cổ phiếu")
        })
    }
);

const priceTool = tool(
    async ({ ticker, days }: { ticker: string, days?: number }) => {
        const endHistoryDate = moment().add(3, 'days').unix();
        const res = await get(`https://apipubaws.tcbs.com.vn/stock-insight/v2/stock/bars-long-term?ticker=${ticker}&type=stock&resolution=D&to=${endHistoryDate}&countBack=${days ? days : 30}`);
        return res;
    },
    {
        name: "StockPriceFetcher",
        description: "Truy xuất thông tin giá hiện tại và lịch sử của một cổ phiếu",
        schema: z.object({
            ticker: z.string().describe("Mã cổ phiếu"),
            //days: z.number().optional().describe("Số ngày trong quá khứ muốn lấy lịch sử giá. Ví dụ: 30, 90,...")
        })
    }
);

const tools = [
    NewsTool,
    // overview,
    stockratio,
    stock_same_industry,
    listTechnicalIndicator,
    Fundamental_Technical_Analysis,
    dividend,
    incomestatement,
    balancesheet,
    cashflow,
    financialratio,
    priceTool
];

const RECURSION_LIMIT = 5 * 2 + 1; // RECURSION_LIMIT trong langgraph = số lần gọi tool * 2 + 1;

const get = async (url: string) => {
    try {
        let res = await fetch(url, { headers: { "accept-language": "vi" } });
        let body = await res.json();
        return JSON.stringify(body, (key, value) => (value === null ? undefined : value));
    } catch {
        return {};
    }
}

const post = async (url: string, data: string) => {
    try {
        let res = await fetch(url, { method: "POST", headers: { "accept-language": "vi", 'Content-Type': 'application/json' }, body: data });
        let body = await res.json();
        return body;
    } catch {
        return {};
    }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const StockScoring = async (isLongTerm: boolean) => {
    try {
        const llm = new ChatMistralAI(
            {
                model: 'mistral-large-latest',
                apiKey: getMistralApiKey(),
                temperature: 0,
                topP: 1
            }
        );

        const app = createReactAgent({
            llm,
            tools,
            messageModifier: isLongTerm ? LongTermInstruction : ShortTermInstruction
        });

        for (let i = 0; i < ticker_info.length; i++) {
            const messages = isLongTerm ? [
                new HumanMessage(`Đánh giá điểm cho đầu tư dài hạn cổ phiếu ${ticker_info[i].symbol}`)
            ] : [
                new HumanMessage(`Đánh giá điểm cho đầu tư ngắn hạn cổ phiếu ${ticker_info[i].symbol}`)
            ];

            const resp = await app.invoke(
                {
                    messages
                },
                {
                    recursionLimit: RECURSION_LIMIT
                }
            );

            try {
                console.log(resp.messages[resp.messages.length - 1].content);
                const score = Number(resp.messages[resp.messages.length - 1].content.match(/Tổng cộng điểm.*?(\d+)(?!.*\d\/100)/i)[1]);

                console.log(score);

                await db
                    .insert(scoring)
                    .values({
                        symbol: ticker_info[i].symbol,
                        score: score,
                        type: isLongTerm ? "LongTerm" : "ShortTerm",
                        content: resp.messages[resp.messages.length - 1].content,
                        creatAt: new Date().toISOString()
                    });
                console.log(`Stock Scoring, Waiting 61s`);
                await delay(61000);
            } catch (e) {
                console.error(e);
                console.log(`Retry analysis ${ticker_info[i].symbol}`);
                i -= 1;
            }
        }
    } catch (err) {
        console.error(err);
    }
};

export default StockScoring;

//StockScoring(true);