import {pgTable, integer, text, timestamp, date, check, boolean, index, uuid} from "drizzle-orm/pg-core";
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

// Table refresh_tokens: one row per issued refresh token (see lib/refreshTokens.ts).
// Rotated tokens are kept (replaced_at) to detect reuse of a stolen token.
export const refresh_tokens = pgTable('refresh_tokens', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    user_id: integer()
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    // all tokens of one login share the family; reuse revokes the whole family
    family_id: uuid().notNull(),
    // SHA-256 of the token, the token itself is never stored
    token_hash: text().notNull().unique(),
    // start of the login, carried over on rotation (absolute limit)
    session_started_at: timestamp({withTimezone: true}).notNull(),
    // idle limit, capped by the absolute limit
    expires_at: timestamp({withTimezone: true}).notNull(),
    // set when this token was exchanged for a new one
    replaced_at: timestamp({withTimezone: true}),
    // set on logout or when reuse was detected
    revoked_at: timestamp({withTimezone: true}),
    created_at: timestamp({withTimezone: true}).defaultNow().notNull(),
}, (t) => [
    index("refresh_tokens_family_id_idx").on(t.family_id),
    index("refresh_tokens_expires_at_idx").on(t.expires_at),
])
