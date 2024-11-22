import { getMistralApiKey } from '../../config';
import logger from '../../utils/logger';
import { ChatMistralAI } from "@langchain/mistralai";

export const loadMistralChatModels = async () => {
    const mistralApiKey = getMistralApiKey();

    if (!mistralApiKey) return {};

    try {
        const chatModels = {
            'mistral-large-latest': {
                displayName: 'mistral-large-latest',
                model: new ChatMistralAI(
                    {
                        model: 'mistral-large-latest',
                        apiKey: mistralApiKey,
                        temperature: 0
                    }
                ),
            },
            'open-mistral-nemo': {
                displayName: 'open-mistral-nemo',
                model: new ChatMistralAI(
                    {
                        model: 'open-mistral-nemo',
                        apiKey: mistralApiKey,
                        temperature: 0
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
