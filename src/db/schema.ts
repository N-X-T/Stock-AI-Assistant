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

export const marketInfo = sqliteTable('MarketAnalysis', {
  id: integer('id').primaryKey(),
  content: text('content').notNull(),
  creatAt: text('creatAt').notNull()
});

export const sectorInfo = sqliteTable('SectorAnalysis', {
  id: integer('id').primaryKey(),
  indCode: text('indCode').notNull(),
  indName: text('indName').notNull(),
  indMarketCap: real('indMarketCap').notNull(),
  indIndex: real('indIndex').notNull(),
  indIndexChgPct: real('indIndexChgPct').notNull(),
  indQuantity: real('indQuantity').notNull(),
  indTradedValue: real('indTradedValue').notNull(),
  content: text('content').notNull(),
  creatAt: text('creatAt').notNull()
});