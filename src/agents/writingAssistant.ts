import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
// import {
//   ChatPromptTemplate,
//   MessagesPlaceholder,
//   PromptTemplate,
// } from '@langchain/core/prompts';
import { RunnableLambda, RunnableMap, RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { StreamEvent } from '@langchain/core/tracers/log_stream';
import eventEmitter from 'events';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import logger from '../utils/logger';
import { IterableReadableStream } from '@langchain/core/utils/stream';
import fs from 'fs/promises';
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OllamaEmbeddings } from '@langchain/ollama';
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { GraphRecursionError } from "@langchain/langgraph";
import moment from 'moment';

const stockPrompt = `Bạn là một nhà phân tích tài chính dày dạn kinh nghiệm được giao nhiệm vụ trả lời các câu hỏi về tài chính, chứng khoán của người dùng.`;

const NewsTool = tool(
  async ({ query, ticker, date }: { query: string, ticker: string, date?: string }) => {
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
    let filter;

    if (!date) {
      filter = { symbol: ticker };
    } else {
      filter = { symbol: ticker, date: date };
    }

    const similaritySearchResults = await vectorStore.similaritySearch(
      query,
      2,
      filter
    );

    return similaritySearchResults.map(doc => doc.pageContent).join("\n\n");
  },
  {
    name: "news_function",
    description: "Truy xuất thông tin về tin tức liên quan tới một mã cổ phiếu cụ thể",
    schema: z.object({
      query: z.string().describe("Câu truy vấn tin tức"),
      ticker: z.string().describe("Mã cổ phiếu của công ty cần lấy thông tin tin tức"),
      //date: z.string().optional().describe("Ngày của tin tức định dạng YYYY-MM-DD")
    })
  }
);

// const PriceTool = tool(
//   async ({ ticker }: { ticker: string }) => {
//     let PriceDynamics = await fs.readFile(`./data/stock/${ticker}/summaryDynamicPrice/summary.txt`, "utf-8");
//     return PriceDynamics;
//   },
//   {
//     name: "price_function",
//     description: "Lấy thông tin về biến động giá của một mã cổ phiếu cụ thể",
//     schema: z.object({
//       ticker: z.string().describe("Mã cổ phiếu của công ty cần lấy thông tin")
//     })
//   }
// );

// const FinancialAnalysisTool = tool(
//   async ({ ticker }: { ticker: string }) => {
//     // let BCTC = await fs.readFile(`./data/stock/${ticker}/summary/summary.txt`, "utf-8");
//     // return BCTC;
//     const pathh = `./data/stock/${ticker}/raw`;

//     const overview = await fs.readFile(`${pathh}/overview.json`, { encoding: "utf-8" });
//     const stock_ratio = await fs.readFile(`${pathh}/stockratio.json`, { encoding: "utf-8" });
//     const industryAvg = await fs.readFile(`${pathh}/industryAvg.json`, { encoding: "utf-8" });
//     const price_volatility = await fs.readFile(`${pathh}/price_volatility.json`, { encoding: "utf-8" });
//     const balance_sheet = await fs.readFile(`${pathh}/balancesheet.json`, { encoding: "utf-8" });
//     const cash_flow = await fs.readFile(`${pathh}/cashflow.json`, { encoding: "utf-8" });
//     const income_statement = await fs.readFile(`${pathh}/incomestatement.json`, { encoding: "utf-8" });
//     const financial_ratio = await fs.readFile(`${pathh}/financialratio.json`, { encoding: "utf-8" });

//     return `---
// Overview
// ${overview}
// ---
// Stock ratio
// ${stock_ratio}
// ---
// Industry Average
// ${industryAvg}
// ---
// History Price
// ${price_volatility}
// ---
// Balance Sheet
// ${balance_sheet}
// ---
// Income Statement
// ${income_statement}
// ---
// Cash Flow
// ${cash_flow}
// ---
// Financial Ratio
// ${financial_ratio}
// ---`;
//   },
//   {
//     name: "financial_function",
//     description: "Lấy thông tin về báo cáo tài chính của một mã cổ phiếu cụ thể",
//     schema: z.object({
//       ticker: z.string().describe("Mã cổ phiếu của công ty cần lấy thông tin")
//     })
//   }
// );

// const MacroEcomomicTool = tool(
//   async ({ ticker }: { ticker: string }) => {
//     return `Chưa có thông tin về kinh tế vĩ mô cho mã ${ticker}`;
//   },
//   {
//     name: "macroEconomic_function",
//     description: "Lấy thông tin về kinh tế vĩ mô liên quan một mã cổ phiếu cụ thể",
//     schema: z.object({
//       ticker: z.string().describe("Mã cổ phiếu của công ty cần lấy thông tin")
//     })
//   }
// );

// const CommonInfoTool = tool(
//   async () => {
//     let common = await fs.readFile(`./data/common/all/summary.txt`, "utf-8");
//     return common;
//   },
//   {
//     name: "common_info_function",
//     description: "Lấy thông tin chung về tình hình toàn thị trường chứng khoán",
//   }
// );

const overview = tool(
  async ({ ticker }: { ticker: string }) => {
    const overview = await get(`https://apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/${ticker}/overview`);
    return overview;
  },
  {
    name: "overview_function",
    description: "Truy xuất thông tin chung về một cổ phiếu cụ thể",
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
    const endHistoryDate = moment().unix();
    const res = await get(`https://apipubaws.tcbs.com.vn/stock-insight/v2/stock/bars-long-term?ticker=${ticker}&type=stock&resolution=D&to=${endHistoryDate}&countBack=${days ? days : 30}`);
    return res;
  },
  {
    name: "prices_function",
    description: "Lấy lịch sử giá của một mã cổ phiếu cụ thể",
    schema: z.object({
      ticker: z.string().describe("Mã cổ phiếu"),
      //days: z.number().optional().describe("Số ngày trong quá khứ muốn lấy lịch sử giá. Ví dụ: 30, 90,...")
    })
  }
);

//const tools = [NewsTool, PriceTool, FinancialAnalysisTool, MacroEcomomicTool, CommonInfoTool];

const tools = [
  NewsTool,
  //overview,
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

const strParser = new StringOutputParser();

const get = async (url: string) => {
  try {
    let res = await fetch(url);
    let body = await res.json();
    return JSON.stringify(body, (key, value) => (value === null ? undefined : value));
  } catch {
    return {};
  }
}

const handleStream = async (
  stream: IterableReadableStream<StreamEvent>,
  emitter: eventEmitter,
) => {
  for await (const event of stream) {
    if (
      event.event === 'on_chain_stream' &&
      event.name === 'FinalResponseGenerator'
    ) {
      emitter.emit(
        'data',
        JSON.stringify({ type: 'response', data: event.data.chunk }),
      );
    }
    if (
      event.event === 'on_chain_end' &&
      event.name === 'FinalResponseGenerator'
    ) {
      // emitter.emit('end', JSON.stringify(suggestions));
      emitter.emit('end', "[]");
    }
  }
};

type BasicChainInput = {
  chat_history: BaseMessage[];
  query: string;
};

const createStockChain = (llm: BaseChatModel) => {
  const app = createReactAgent({
    llm,
    tools,
    messageModifier: stockPrompt
  });

  // return RunnableSequence.from([
  //   RunnableMap.from({
  //     chat_history: (input: BasicChainInput) => input.chat_history,
  //     query: async (input: BasicChainInput) => {
  //       const prompt = `Bạn là một chuyên gia tài chính, chứng khoán dày dạn kinh nghiệm. Nhiệm vụ của bạn là chỉ ra các bước thực hiện một cách ngắn gọn cho các tác vụ sau: ${input.query}`;
  //       const CoT = await llm.invoke(prompt);
  //       return `Thực hiện các bước sau sử dụng các default.API tôi đã cung cấp để lấy thông tin:\n${CoT.content}`;
  //     }
  //   }),
  //   RunnableLambda.from(
  //     async (input: BasicChainInput) => {
  //       try {
  //         const resp = await app.invoke(
  //           {
  //             messages: [
  //               ...input.chat_history,
  //               new HumanMessage(input.query)
  //             ]
  //           },
  //           {
  //             recursionLimit: RECURSION_LIMIT
  //           }
  //         );
  //         return resp.messages[resp.messages.length - 1];
  //       } catch (e) {
  //         if (e instanceof GraphRecursionError) {
  //           console.error(e.lc_error_code, `Query: ${input.query}`);
  //           return new AIMessage("Hiện tại, tôi không đủ thông tin để trả lời câu hỏi của bạn!");
  //         } else {
  //           throw e;
  //         }
  //       }
  //     }
  //   ),
  //   strParser
  // ]).withConfig({
  //   runName: 'FinalResponseGenerator'
  // });

  // Use mistral - large model
  return RunnableSequence.from([
    RunnableLambda.from(
      async (input: BasicChainInput) => {
        try {
          const resp = await app.invoke(
            {
              messages: [
                ...input.chat_history,
                new HumanMessage(input.query)
              ]
            },
            {
              recursionLimit: RECURSION_LIMIT
            }
          );
          return resp.messages[resp.messages.length - 1];
        } catch (e) {
          if (e instanceof GraphRecursionError) {
            console.error(e.lc_error_code, `Query: ${input.query}`);
            return new AIMessage("Hiện tại, tôi không đủ thông tin để trả lời câu hỏi của bạn!");
          } else {
            throw e;
          }
        }
      }
    ),
    strParser
  ]).withConfig({
    runName: 'FinalResponseGenerator'
  });
};

const handleWritingAssistant = (
  query: string,
  history: BaseMessage[],
  llm: BaseChatModel,
  embeddings: Embeddings,
) => {
  const emitter = new eventEmitter();

  try {
    let stockChain = createStockChain(llm);

    const stream = stockChain.streamEvents(
      {
        chat_history: history,
        query: query,
      },
      {
        version: 'v1',
      },
    );

    handleStream(stream, emitter);
  } catch (err) {
    emitter.emit(
      'error',
      JSON.stringify({ data: 'An error has occurred please try again later' }),
    );
    logger.error(`Error in writing assistant: ${err}`);
  }

  return emitter;
};

export default handleWritingAssistant;
