import { BaseMessage } from '@langchain/core/messages';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from '@langchain/core/prompts';
import { RunnableLambda, RunnableMap, RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { StreamEvent } from '@langchain/core/tracers/log_stream';
import eventEmitter from 'events';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import logger from '../utils/logger';
import { IterableReadableStream } from '@langchain/core/utils/stream';
import fs from 'fs/promises';
import LineListOutputParser from '../lib/outputParsers/listLineOutputParser';
import LineOutputParser from '../lib/outputParsers/lineOutputParser';
import formatChatHistoryAsString from '../utils/formatHistory';

const retriverPrompt = `Bạn sẽ được cung cấp một cuộc trò chuyện và một câu hỏi tiếp theo, bạn sẽ phải diễn đạt lại câu hỏi tiếp theo để nó trở thành một câu hỏi độc lập và có thể được LLM khác sử dụng để tìm kiếm thông tin để trả lời.
Câu trả lời của bạn chỉ trả về theo định dạng sau:
---
<question>
[Câu hỏi đã được diễn đạt lại thành một câu hỏi độc lập]
</question>

<type>
[common/specific/no: "common" khi câu hỏi nhắc tới vấn đề tài chính, chứng khoán nói chung; "specific" khi nhắc tới một hoặc vài công ty/mã cổ phiếu cụ thể; "no" khi câu hỏi không thuộc phạm vi tài chính chứng khoán]
</type>

<ticker>
[nếu không nhắc tới công ty/mã cổ phiếu nào thì không cần trả về thẻ <ticker>, trả về mã cổ phiếu của công ty được nhắc tới trong câu hỏi của người dùng, mỗi mã cổ phiếu trên một dòng]
</ticker>
---
Bất kỳ nội dung nào bên dưới đều là một phần của cuộc trò chuyện thực tế và bạn cần sử dụng cuộc trò chuyện và câu hỏi tiếp theo để diễn đạt lại câu hỏi tiếp theo thành một câu hỏi độc lập dựa trên các hướng dẫn được chia sẻ ở trên.

Lịch sử trò chuyện:
{chat_history}

Câu hỏi tiếp theo: {query}
`

const stockPrompt = `Bạn là một nhà phân tích tài chính dày dạn kinh nghiệm được giao nhiệm vụ trả lời các câu hỏi về tài chính, chứng khoán của người dùng. Kết hợp kiến thức sẵn có và dữ liệu bổ sung bên giới để trả lời câu hỏi người dùng một cách tốt nhất.
Dưới đây là thông tin bổ sung về tình hình tài chính, chứng khoán giúp bạn trả lời câu hỏi của người dùng:
{info}`

const suggestionsStockPrompt = `Bạn là một nhà phân tích tài chính dày dạn kinh nghiệm được giao nhiệm vụ đưa ra quyết định mua/bán/giữ dựa trên dữ liệu tài chính của một công ty.
Câu trả lời của bạn phải có định dạng sau:
## Thời gian cập nhật dữ liệu: [Thời gian cập nhật]
## Khuyến nghị: [Mua/Bán/Giữ]
## Lý do: [Lý do đưa ra khuyến nghị dựa vào dữ liệu tài chính]

Dưới đây là dữ liệu tài chính bổ sung về tình hình tài chính công ty:
{info}
`;

const strParser = new StringOutputParser();

let suggestions = [];

const loadStock = async (ticker: string) => {
  let BCTC = await fs.readFile(`./data/stock/${ticker}/summary/summary.txt`);
  let PriceDynamics = await fs.readFile(`./data/stock/${ticker}/summaryDynamicPrice/summary.txt`);

  return `${BCTC}\n\n${PriceDynamics}`;
};

const loadCommonMarket = async () => {
  let common = await fs.readFile(`./data/common/all/summary.txt`);
  return common;
};

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
      emitter.emit('end', JSON.stringify(suggestions));
    }
  }
};

const createRetrieverChain = (llm: BaseChatModel) => {
  return RunnableSequence.from([
    PromptTemplate.fromTemplate(retriverPrompt),
    llm,
    strParser,
    async (input: string) => {
      const questionOutputParser = new LineOutputParser({
        key: 'question',
      });

      const typeOutputParser = new LineOutputParser({
        key: 'type',
      });

      const tickersOutputParser = new LineListOutputParser({
        key: 'ticker',
      });

      //const question = await questionOutputParser.parse(input);
      const type = await typeOutputParser.parse(input);
      const tickers = await tickersOutputParser.parse(input);

      switch (type) {
        case "no": {
          suggestions = [];
          return "";
        }
        case "specific": {
          suggestions = [];
          let stockInfo = "";
          if (tickers.length > 0) {
            for (let i in tickers) {
              suggestions.push(`Nên mua/bán/giữ cổ phiếu ${tickers[i]}?`);
              let infomation = await loadStock(tickers[i]);
              stockInfo += infomation + "\n";
            }
          }
          return stockInfo;
        }
        case "common": {
          suggestions = [];
          let commonInfo = await loadCommonMarket();
          let stockInfo = "";
          if (tickers.length > 0) {
            for (let i in tickers) {
              let infomation = await loadStock(tickers[i]);
              stockInfo += infomation + "\n";
            }
          }
          return `${commonInfo}\n\n${stockInfo}`;
        }
      }
    }
  ]);
}

type BasicChainInput = {
  chat_history: BaseMessage[];
  query: string;
};

const createSuggestionsStockChain = (llm: BaseChatModel) => {
  return RunnableSequence.from([
    RunnableMap.from({
      query: (input: BasicChainInput) => input.query,
      info: async (input: BasicChainInput) => {
        const ticker = [...input.query.matchAll(/Nên mua\/bán\/giữ cổ phiếu (.+?)\?/g)][0][1];
        return await loadStock(ticker);
      },
    }),
    ChatPromptTemplate.fromMessages([
      ['system', suggestionsStockPrompt],
      ['user', '{query}'],
    ]),
    llm,
    strParser,
  ]).withConfig({
    runName: 'FinalResponseGenerator'
  });;
}

const createStockChain = (llm: BaseChatModel) => {
  const retrieverChain = createRetrieverChain(llm);

  return RunnableSequence.from([
    RunnableMap.from({
      query: (input: BasicChainInput) => input.query,
      chat_history: (input: BasicChainInput) => input.chat_history,
      info: RunnableSequence.from([
        (input) => ({
          query: input.query,
          chat_history: formatChatHistoryAsString(input.chat_history),
        }),
        retrieverChain
      ]),
    }),
    ChatPromptTemplate.fromMessages([
      ['system', stockPrompt],
      new MessagesPlaceholder('chat_history'),
      ['user', '{query}'],
    ]),
    llm,
    strParser,
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
    let stockChain;
    if (query.startsWith("Nên mua/bán/giữ cổ phiếu")) {
      stockChain = createSuggestionsStockChain(llm);
    } else {
      stockChain = createStockChain(llm);
    }
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
