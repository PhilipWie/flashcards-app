import {pgTable, integer, text, timestamp, date, check, boolean, index} from "drizzle-orm/pg-core";
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

// Table reviews: one row per answer in learn mode (learning history for the statistics)
export const reviews = pgTable('reviews', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    card_id: integer()
        .notNull()
        .references(() => cards.id, { onDelete: 'cascade' }),
    correct: boolean().notNull(),
    reviewed_at: timestamp({withTimezone: true}).defaultNow().notNull(),
}, (t) => [
    // the stats query joins reviews -> cards -> decks of one user
    index("reviews_card_id_idx").on(t.card_id),
])
