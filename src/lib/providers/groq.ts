import { ChatGroq } from "@langchain/groq";
import { getGroqApiKey } from '../../config';
import logger from '../../utils/logger';

export const loadGroqChatModels = async () => {
  const groqApiKey = getGroqApiKey();

  if (!groqApiKey) return {};

  try {
    const chatModels = {
      'llama-3.3-70b-versatile': {
        displayName: 'llama-3.3-70b-versatile',
        model: new ChatGroq(
          {
            apiKey: groqApiKey,
            modelName: 'llama-3.3-70b-versatile',
            temperature: 0,
          }
        ),
      },
      'mixtral-8x7b-32768': {
        displayName: 'Mixtral 8x7B',
        model: new ChatGroq(
          {
            apiKey: groqApiKey,
            modelName: 'mixtral-8x7b-32768',
            temperature: 0,
            maxTokens: 32768
          }
        ),
      }
    };

    return chatModels;
  } catch (err) {
    logger.error(`Error loading Groq models: ${err}`);
    return {};
  }
};
