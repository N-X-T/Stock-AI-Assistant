import { EventEmitter, WebSocket } from 'ws';
import { BaseMessage, AIMessage, HumanMessage } from '@langchain/core/messages';
import handleWritingAssistant from '../agents/writingAssistant';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import logger from '../utils/logger';
import db from '../db';
import { chats, messages } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import crypto from 'crypto';

type Message = {
  messageId: string;
  chatId: string;
  content: string;
};

type WSMessage = {
  message: Message;
  type: string;
  isAdvanceMode: boolean;
};

const handleEmitterEvents = (
  emitter: EventEmitter,
  ws: WebSocket,
  messageId: string,
  chatId: string,
) => {
  let recievedMessage = '';
  let sources = [];

  emitter.on('data', (data) => {
    const parsedData = JSON.parse(data);
    if (parsedData.type === 'response') {
      ws.send(
        JSON.stringify({
          type: 'message',
          data: parsedData.data,
          messageId: messageId,
        }),
      );
      recievedMessage += parsedData.data;
    } else if (parsedData.type === 'sources') {
      ws.send(
        JSON.stringify({
          type: 'sources',
          data: parsedData.data,
          messageId: messageId,
        }),
      );
      sources = parsedData.data;
    }
  });
  emitter.on('end', () => {
    ws.send(JSON.stringify({ type: 'messageEnd', messageId: messageId }));

    db.insert(messages)
      .values({
        content: recievedMessage,
        chatId: chatId,
        messageId: messageId,
        role: 'assistant',
        metadata: JSON.stringify({
          createdAt: new Date(),
          ...(sources && sources.length > 0 && { sources }),
        }),
      })
      .execute();
  });
  emitter.on('error', (data) => {
    const parsedData = JSON.parse(data);
    ws.send(
      JSON.stringify({
        type: 'error',
        data: parsedData.data,
        key: 'CHAIN_ERROR',
      }),
    );
  });
};

export const handleMessage = async (
  message: string,
  ws: WebSocket,
  llm: BaseChatModel,
  embeddings: Embeddings,
) => {
  try {
    const parsedWSMessage = JSON.parse(message) as WSMessage;
    const parsedMessage = parsedWSMessage.message;

    if (parsedWSMessage.type === 'Ping') {
      ws.send(
        JSON.stringify({
          type: "Pong"
        })
      );
      return;
    }

    const id = parsedWSMessage.message.messageId ? parsedWSMessage.message.messageId : crypto.randomBytes(7).toString('hex');

    if (!parsedMessage.content)
      return ws.send(
        JSON.stringify({
          type: 'error',
          data: 'Invalid message format',
          key: 'INVALID_FORMAT',
        }),
      );

    let historyDb = (await db.query.messages.findMany({
      where: and(eq(messages.chatId, parsedMessage.chatId), eq(messages.isDelete, false)),
    }));//.sort((a, b) => new Date(JSON.parse(a.metadata).createdAt).getTime() - new Date(JSON.parse(b.metadata).createdAt).getTime())
    const index = historyDb.findIndex((msg) => msg.messageId === id);
    if (index !== -1) {
      const idsToDelete = historyDb.slice(index, historyDb.length).map(history => history.id);
      for (let i in idsToDelete)
        await db.update(messages)
          .set({ isDelete: true })
          .where(eq(messages.id, idsToDelete[i]));
      historyDb = historyDb.slice(0, index);
    }
    const history: BaseMessage[] = historyDb.map((msg) => {
      if (msg.role === 'user') {
        return new HumanMessage({
          content: msg.content,
        });
      } else {
        return new AIMessage({
          content: msg.content,
        });
      }
    });

    if (parsedWSMessage.type === 'message') {
      const emitter = handleWritingAssistant(
        parsedMessage.content,
        parsedWSMessage.isAdvanceMode,
        history,
        llm,
        embeddings
      );

      handleEmitterEvents(emitter, ws, id, parsedMessage.chatId);

      const chat = await db.query.chats.findFirst({
        where: eq(chats.id, parsedMessage.chatId),
      });

      if (!chat) {
        await db
          .insert(chats)
          .values({
            id: parsedMessage.chatId,
            title: parsedMessage.content,
            createdAt: new Date().toString(),
          })
          .execute();
      }

      await db
        .insert(messages)
        .values({
          content: parsedMessage.content,
          chatId: parsedMessage.chatId,
          messageId: id,
          role: 'user',
          metadata: JSON.stringify({
            createdAt: new Date(),
          }),
        })
        .execute();
    }
  } catch (err) {
    ws.send(
      JSON.stringify({
        type: 'error',
        data: 'Invalid message format',
        key: 'INVALID_FORMAT',
      }),
    );
    logger.error(`Failed to handle message: ${err}`);
  }
};
