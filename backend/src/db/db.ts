import {drizzle} from 'drizzle-orm/node-postgres'
import * as schema from "./schema.js"
if (!process.env.DATABASE_URL) throw new Error("Missing DB URL (env)")
export const db = drizzle(process.env.DATABASE_URL!, {schema, casing: "snake_case"})