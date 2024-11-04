import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp
} from "drizzle-orm/mysql-core";

export const userSystemEnum = mysqlEnum("user_system_enum", ["system", "user"]);

export const chats = mysqlTable("chats", {
  id: int("id").autoincrement().primaryKey(),
  pdfName: text("pdf_name").notNull(),
  pdfUrl: text("pdf_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  fileKey: text("file_key").notNull(),
});

export type DrizzleChat = typeof chats.$inferSelect;

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),  // Changed to int().autoincrement()
  chatId: int("chat_id")
    .references(() => chats.id)
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  role: userSystemEnum.notNull(),  
});
