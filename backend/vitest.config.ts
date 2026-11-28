import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
        // dummy values: jwt.ts and db/db.ts throw at import without them.
        // the database is never reached, tests only use routes that answer before a query
        env: {
            JWT_SECRET: "test-secret-only-for-vitest-at-least-32-chars",
            DATABASE_URL: "postgresql://test:test@localhost:5432/test",
            FRONTEND_URL: "http://localhost:5173",
        },
    },
});
