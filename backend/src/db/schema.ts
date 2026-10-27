import {pgTable, integer, text, timestamp, date, check} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";
// Table users
export const users = pgTable('users', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    email: text().notNull().unique(),
    password_hash: text().notNull(),
    created_at: timestamp( {withTimezone: true}).defaultNow().notNull(),
})
// Table decks
export const decks = pgTable('decks', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    user_id: integer()
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    created_at: timestamp({withTimezone: true}).defaultNow().notNull(),
})
// Table cards
export const cards = pgTable('cards', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    deck_id: integer()
    .notNull()
    .references(() => decks.id, { onDelete: 'cascade' }),
    front: text().notNull(),
    back: text().notNull(),
    box: integer().notNull().default(1),
    next_review: date().notNull().default(sql`CURRENT_DATE`),
    created_at: timestamp({withTimezone: true}).defaultNow().notNull(),
}, (t) => [
    check("cards_box_range", sql`${t.box} >= 1 AND ${t.box} <= 5`),
])
