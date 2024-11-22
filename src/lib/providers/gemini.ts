import { getGeminiApiKey } from '../../config';
import logger from '../../utils/logger';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const loadGeminiChatModels = async () => {
    const geminiApiKey = getGeminiApiKey();

    if (!geminiApiKey) return {};

    try {
        const chatModels = {
            'gemini-1.5-flash': {
                displayName: 'gemini-1.5-flash',
                model: new ChatGoogleGenerativeAI(
                    {
                        model: 'gemini-1.5-flash',
                        apiKey: geminiApiKey,
                        temperature: 0
                    }
                ),
            },
            'gemini-1.5-pro': {
                displayName: 'gemini-1.5-pro',
                model: new ChatGoogleGenerativeAI(
                    {
                        model: 'gemini-1.5-pro',
                        apiKey: geminiApiKey,
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
