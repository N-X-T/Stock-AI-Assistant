// import { config } from 'dotenv'
// config();

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { Runnable, RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";

(async function () {
    const llm = new ChatGoogleGenerativeAI(
        {
            model: 'gemini-1.5-flash',
            apiKey: "AIzaSyCwvp-B6afeHAozxV6Ctrrjv_UNWoUIfqg",
            temperature: 0
        });
    const magicTool = tool(
        async ({ input }: { input: number }) => {
            return `Kết quả của magic_function(${input}) là ${input + 2}`;
        },
        {
            name: "magic_function",
            description: "Tính toán logic khi hàm magic_function được gọi với 1 số đầu vào",
            schema: z.object({
                input: z.number(),
            }),
        }
    );

    const tools = [magicTool];

    const query = "Kết quả sau khi gọi hàm magic_function(3)?";

    const app = createReactAgent({
        llm,
        tools,
    });

    const stream = await RunnableSequence.from([
        RunnableLambda.from(
            ({ query, chat_history }: { query: string, chat_history: BaseMessage[] }) => {
                return {
                    messages: [...chat_history, new HumanMessage(query)]
                }
            }
        ),
        app,
        RunnableLambda.from(
            (input) => {
                console.log(input);
                //return "haha";
            }
        ),
    ]).stream({
        query: query,
        chat_history: []
    });

    // for await (const event of stream) {
    //     console.log(event);
    // }

    // let agentOutput = await app.invoke({
    //     messages: [
    //         {
    //             role: "user",
    //             content: query,
    //         },
    //     ],
    // }, {
    //     recursionLimit: 5
    // });

    // console.log(agentOutput);
})();