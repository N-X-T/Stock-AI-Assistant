import { ChatGroq } from "@langchain/groq";
import { getGroqApiKey } from '../../config';
import logger from '../../utils/logger';

export const loadGroqChatModels = async () => {
  const groqApiKey = getGroqApiKey();

  if (!groqApiKey) return {};

  try {
    const chatModels = {
      'llama-3.2-3b-preview': {
        displayName: 'Llama 3.2 3B',
        model: new ChatGroq(
          {
            apiKey: groqApiKey,
            modelName: 'llama-3.2-3b-preview',
            temperature: 0,
            maxTokens: 8192
          }
        ),
      },
      'llama-3.2-90b-vision-preview': {
        displayName: 'Llama 3.2 90B (Preview)',
        model: new ChatGroq(
          {
            apiKey: groqApiKey,
            modelName: 'llama-3.2-90b-vision-preview',
            temperature: 0,
            maxTokens: 8192
          }
        ),
      },
      'llama-3.1-70b-versatile': {
        displayName: 'Llama 3.1 70B',
        model: new ChatGroq(
          {
            apiKey: groqApiKey,
            modelName: 'llama-3.1-70b-versatile',
            temperature: 0,
            maxTokens: 8192
          },
        ),
      },
      'llama-3.1-8b-instant': {
        displayName: 'Llama 3.1 8B',
        model: new ChatGroq(
          {
            apiKey: groqApiKey,
            modelName: 'llama-3.1-8b-instant',
            temperature: 0,
            maxTokens: 8192
          }
        ),
      },
      'llama3-8b-8192': {
        displayName: 'LLaMA3 8B',
        model: new ChatGroq(
          {
            apiKey: groqApiKey,
            modelName: 'llama3-8b-8192',
            temperature: 0,
            maxTokens: 8192
          }
        ),
      },
      'llama3-70b-8192': {
        displayName: 'LLaMA3 70B',
        model: new ChatGroq(
          {
            apiKey: groqApiKey,
            modelName: 'llama3-70b-8192',
            temperature: 0,
            maxTokens: 8192
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
      },
      'gemma-7b-it': {
        displayName: 'Gemma 7B',
        model: new ChatGroq(
          {
            apiKey: groqApiKey,
            modelName: 'gemma-7b-it',
            temperature: 0,
            maxTokens: 8192
          }
        ),
      },
      'gemma2-9b-it': {
        displayName: 'Gemma2 9B',
        model: new ChatGroq(
          {
            apiKey: groqApiKey,
            modelName: 'gemma2-9b-it',
            temperature: 0,

            maxTokens: 8192
          }
        ),
      },
    };

    return chatModels;
  } catch (err) {
    logger.error(`Error loading Groq models: ${err}`);
    return {};
  }
};
