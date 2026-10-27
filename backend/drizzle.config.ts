import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    casing: "snake_case", //automatically maps property names to db columns
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});