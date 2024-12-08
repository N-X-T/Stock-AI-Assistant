import { text, integer, real, sqliteTable } from 'drizzle-orm/sqlite-core';

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey(),
  content: text('content').notNull(),
  chatId: text('chatId').notNull(),
  messageId: text('messageId').notNull(),
  role: text('type', { enum: ['assistant', 'user'] }),
  metadata: text('metadata', {
    mode: 'json',
  }),
  isDelete: integer('isDelete', { mode: "boolean" }).default(false),
});

export const chats = sqliteTable('chats', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: text('createdAt').notNull(),
});

export const scoring = sqliteTable('scoring', {
  id: integer('id').primaryKey(),
  symbol: text('symbol').notNull(),
  score: real('score').notNull(),
  type: text('type', { enum: ['LongTerm', 'ShortTerm'] }).notNull(),
  content: text('content').notNull(),
  creatAt: text('creatAt').notNull()
});