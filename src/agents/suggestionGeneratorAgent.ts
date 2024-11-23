import { RunnableSequence, RunnableMap } from '@langchain/core/runnables';
import ListLineOutputParser from '../lib/outputParsers/listLineOutputParser';
import { PromptTemplate } from '@langchain/core/prompts';
import formatChatHistoryAsString from '../utils/formatHistory';
import { BaseMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';

const suggestionGeneratorPrompt = `
Bạn là trình tạo gợi ý AI gợi ý các câu hỏi tiếp theo. Bạn sẽ được cung cấp một cuộc trò chuyện bên dưới. Bạn cần tạo 4-5 gợi ý dựa trên cuộc trò chuyện.
Bạn cần đảm bảo các gợi ý có liên quan đến cuộc trò chuyện và hữu ích cho người dùng. Lưu ý rằng người dùng có thể sử dụng các gợi ý này để yêu cầu mô hình trò chuyện cung cấp thêm thông tin.
Đảm bảo các gợi ý có độ dài trung bình, mang tính thông tin và có liên quan đến cuộc trò chuyện.

Cung cấp các gợi ý này được phân tách bằng dòng mới giữa các thẻ XML <suggestions> và </suggestions>. Ví dụ:

<suggestions>
Hãy cho tôi biết thêm về SpaceX và các dự án gần đây của họ
Tin tức mới nhất về SpaceX là gì?
Ai là CEO của SpaceX?
</suggestions>

Cuộc trò chuyện:
{chat_history}
`;

type SuggestionGeneratorInput = {
  chat_history: BaseMessage[];
};

const outputParser = new ListLineOutputParser({
  key: 'suggestions',
});

const createSuggestionGeneratorChain = (llm: BaseChatModel) => {
  return RunnableSequence.from([
    RunnableMap.from({
      chat_history: (input: SuggestionGeneratorInput) =>
        formatChatHistoryAsString(input.chat_history),
    }),
    PromptTemplate.fromTemplate(suggestionGeneratorPrompt),
    llm,
    outputParser,
  ]);
};

const generateSuggestions = (
  input: SuggestionGeneratorInput,
  llm: BaseChatModel,
) => {
  (llm as unknown as ChatOpenAI).temperature = 0;
  const suggestionGeneratorChain = createSuggestionGeneratorChain(llm);
  return suggestionGeneratorChain.invoke(input);
};

export default generateSuggestions;
